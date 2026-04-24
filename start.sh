#!/bin/bash
cd ~/projects/agorax
export DEMO_MODE=true
export DATABASE_URL="postgresql://meditalks@localhost:5432/agorax"
export PORT=3001
export GOOGLE_CLIENT_ID="demo-client-id"
export GOOGLE_CLIENT_SECRET="demo-client-secret"
export GOOGLE_CALLBACK_URL="http://localhost:3001/auth/google/callback"
export SESSION_SECRET="demo-session-secret"
export LLM_API_KEY="sk-02ff5ef5cfae481790e94682f39aa364"
export LLM_API_URL="https://staging.xsilico.ai/api/v1"
export LLM_MODEL="nvidia/nemotron-3-nano-30b-a3b:free"
exec node dist/index.js