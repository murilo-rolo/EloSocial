import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY

router = APIRouter()

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

class CreateUserRequest(BaseModel):
    email: str
    password: str
    nome: str
    role: str
    cras: str
    created_by: str | None = None

@router.post("/users")
def create_user(data: CreateUserRequest):
    if not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_KEY não configurada")

    payload = {
        "email": data.email,
        "password": data.password,
        "email_confirm": True,
        "user_metadata": {
            "nome": data.nome,
            "role": data.role,
            "cras": data.cras,
        },
    }

    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=HEADERS,
        json=payload,
    )

    if resp.status_code != 200 and resp.status_code != 201:
        error_msg = resp.json().get("message", "Erro ao criar usuário")
        raise HTTPException(status_code=resp.status_code, detail=error_msg)

    if data.created_by:
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/audit_logs",
                headers=HEADERS,
                json={
                    "user_id": data.created_by,
                    "acao": "criou_usuario",
                    "detalhes": {"email": data.email, "role": data.role, "cras": data.cras},
                },
            )
        except Exception:
            pass

    return {"ok": True, "user": resp.json()}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, created_by: str | None = None):
    if not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_KEY não configurada")

    resp = httpx.delete(
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        headers=HEADERS,
    )

    if resp.status_code != 200 and resp.status_code != 204:
        raise HTTPException(status_code=resp.status_code, detail="Erro ao excluir usuário")

    if created_by:
        try:
            httpx.post(
                f"{SUPABASE_URL}/rest/v1/audit_logs",
                headers=HEADERS,
                json={
                    "user_id": created_by,
                    "acao": "excluiu_usuario",
                    "detalhes": {"user_id_excluido": user_id},
                },
            )
        except Exception:
            pass

    return {"ok": True}
