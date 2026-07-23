import httpx
import secrets
import time
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, DAILY_API_KEY

router = APIRouter()

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

DAILY_HEADERS = {
    "Authorization": f"Bearer {DAILY_API_KEY}",
    "Content-Type": "application/json",
}

class CreateRoomRequest(BaseModel):
    created_by: str
    privacy: str = "public"
    access_code: str | None = None
    participant_ids: list[str] = []
    caso_id: str | None = None

class JoinRoomRequest(BaseModel):
    room_id: str
    access_code: str | None = None


def _generate_access_code():
    return str(secrets.randbelow(900000) + 100000)


@router.post("/rooms")
def create_room(data: CreateRoomRequest):
    if not DAILY_API_KEY:
        raise HTTPException(status_code=500, detail="DAILY_API_KEY não configurada")
    if not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_KEY não configurada")

    exp = int(time.time()) + 7200  # 2 horas

    daily_payload = {
        "properties": {
            "exp": exp,
            "max_participants": 10,
            "enable_chat": True,
            "enable_emoji_reactions": True,
            "enable_knocking": data.privacy == "private",
            "start_video_off": True,
            "start_audio_off": True,
        },
    }

    resp = httpx.post(
        "https://api.daily.co/v1/rooms",
        headers=DAILY_HEADERS,
        json=daily_payload,
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Daily.co error: {resp.text}")

    room_data = resp.json()
    room_name = room_data["name"]
    room_url = room_data["url"]

    access_code = data.access_code
    if data.privacy == "private" and not access_code:
        access_code = _generate_access_code()

    room_id = str(uuid.uuid4())

    insert_payload = {
        "id": room_id,
        "room_name": room_name,
        "room_url": room_url,
        "created_by": data.created_by,
        "privacy": data.privacy,
        "access_code": access_code,
        "expires_at": exp,
    }

    resp_supabase = httpx.post(
        f"{SUPABASE_URL}/rest/v1/video_rooms",
        headers=HEADERS,
        json=insert_payload,
    )

    if resp_supabase.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Erro ao salvar sala no banco")

    if data.participant_ids:
        participants_payload = [
            {"room_id": room_id, "user_id": pid}
            for pid in data.participant_ids
        ]
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/video_participants",
            headers=HEADERS,
            json=participants_payload,
        )

    if data.caso_id:
        resp_triagem_get = httpx.get(
            f"{SUPABASE_URL}/rest/v1/triagens?id=eq.{data.caso_id}&select=user_id",
            headers=HEADERS,
        )
        if resp_triagem_get.status_code == 200 and resp_triagem_get.json():
            requester_id = resp_triagem_get.json()[0]["user_id"]
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/video_participants",
                headers=HEADERS,
                json=[{"room_id": room_id, "user_id": requester_id}],
            )

        daily_expires = int(time.time()) + 7 * 86400  # 7 dias
        triagem_update = {
            "daily_room_url": room_url,
            "daily_room_name": room_name,
            "daily_room_created_at": datetime.now(timezone.utc).isoformat(),
            "daily_room_expires_at": datetime.fromtimestamp(daily_expires, tz=timezone.utc).isoformat(),
            "status": "em_atendimento",
        }
        resp_triagem = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/triagens?id=eq.{data.caso_id}",
            headers=HEADERS,
            json=triagem_update,
        )
        if resp_triagem.status_code not in (200, 201, 204):
            raise HTTPException(status_code=500, detail="Erro ao atualizar triagem com sala de vídeo")

    return {
        "id": room_id,
        "room_name": room_name,
        "url": room_url,
        "privacy": data.privacy,
        "access_code": access_code,
    }


@router.delete("/rooms/{room_id}")
def delete_room(room_id: str, user_id: str):
    if not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_KEY não configurada")

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/video_rooms?id=eq.{room_id}&select=*",
        headers=HEADERS,
    )

    if resp.status_code != 200 or not resp.json():
        raise HTTPException(status_code=404, detail="Sala não encontrada")

    room = resp.json()[0]

    if room["created_by"] != user_id:
        raise HTTPException(status_code=403, detail="Apenas o criador pode excluir esta sala")

    if DAILY_API_KEY:
        try:
            httpx.delete(
                f"https://api.daily.co/v1/rooms/{room['room_name']}",
                headers=DAILY_HEADERS,
                timeout=10,
            )
        except httpx.RequestError:
            pass

    resp_del = httpx.delete(
        f"{SUPABASE_URL}/rest/v1/video_rooms?id=eq.{room_id}",
        headers=HEADERS,
    )

    if resp_del.status_code not in (200, 201, 204):
        raise HTTPException(status_code=500, detail="Erro ao excluir sala do banco")

    return Response(status_code=204)


@router.post("/rooms/join")
def join_room(data: JoinRoomRequest):
    if not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_KEY não configurada")

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/video_rooms?id=eq.{data.room_id}&select=*",
        headers=HEADERS,
    )

    if resp.status_code != 200 or not resp.json():
        raise HTTPException(status_code=404, detail="Sala não encontrada")

    room = resp.json()[0]

    if room.get("privacy") == "private":
        if not data.access_code or data.access_code != room.get("access_code"):
            raise HTTPException(status_code=403, detail="Código de acesso inválido")

    return {
        "id": room["id"],
        "room_name": room["room_name"],
        "url": room["room_url"],
        "privacy": room["privacy"],
    }
