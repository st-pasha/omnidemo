from __future__ import annotations
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Literal

from omnidemo.api.users import router


@router.post("/users/login")
async def login(body: UsersLoginRequest) -> UsersLoginResponse:
    # DEMO ONLY
    # DO NOT USE IN PRODUCTION!!!
    #
    if body.password != "password":
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password",
        )

    return UsersLoginResponse(
        access_token="token",
        username=body.username,
        permission="admin" if body.username == "boss" else "normal",
    )


class UsersLoginRequest(BaseModel):
    username: str
    password: str


class UsersLoginResponse(BaseModel):
    access_token: str
    username: str
    permission: Literal["normal", "admin"]
