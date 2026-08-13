"""FastAPI shell for the student Memory Map webapp."""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from memory_store import MemoryStore

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


class ConnectionInput(BaseModel):
    source_name: str = Field(min_length=1, max_length=100)
    source_type: str = Field(pattern="^(PERSON|OBJECT|LOCATION|EVENT|ORGANIZATION)$")
    relationship_type: str = Field(min_length=1, max_length=60)
    target_name: str = Field(min_length=1, max_length=100)
    target_type: str = Field(pattern="^(PERSON|OBJECT|LOCATION|EVENT|ORGANIZATION)$")
    note: str = Field(default="", max_length=500)


@asynccontextmanager
async def lifespan(app: FastAPI):
    memory = MemoryStore()
    await memory.connect()
    app.state.memory = memory
    yield
    await memory.close()


app = FastAPI(title="Memory Map", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def memory(request: Request) -> MemoryStore:
    return request.app.state.memory


@app.get("/")
async def home() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/api/connections", status_code=201)
async def create_connection(payload: ConnectionInput, request: Request):
    try:
        return await memory(request).store_connection(**payload.model_dump())
    except (ValueError, NotImplementedError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/graph")
async def graph(request: Request):
    try:
        return await memory(request).export_graph()
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc

@app.get("/api/neighbors/{name}")
async def neighbors(name: str, request: Request):
    try:
        return {"query": name, "neighbors": await memory(request).neighbors(name)}
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
