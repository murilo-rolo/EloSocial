import httpx
import secrets
import time
import uuid
from fastapi import APIRouter, HTTPException
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
        daily_expires = int(time.time()) + 7 * 86400  # 7 dias
        triagem_update = {
            "daily_room_url": room_url,
            "daily_room_name": room_name,
            "daily_room_created_at": "now()",
            "daily_room_expires_at": daily_expires,
            "status": "em_atendimento",
        }
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/triagens?id=eq.{data.caso_id}",
            headers=HEADERS,
            json=triagem_update,
        )

    return {
        "id": room_id,
        "room_name": room_name,
        "url": room_url,
        "privacy": data.privacy,
        "access_code": access_code,
    }


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
        "url": room["url"],
        "privacy": room["privacy"],
    }
