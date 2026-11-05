-- Estrutura adicional do chatbot. Não altera users ou foods existentes.
CREATE TABLE IF NOT EXISTS chat_sessions (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    pending_action JSONB,
    recipe_context JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibilidade com bancos que já possuíam chat_sessions de versões anteriores.
ALTER TABLE chat_sessions
    ADD COLUMN IF NOT EXISTS pending_action JSONB;

ALTER TABLE chat_sessions
    ADD COLUMN IF NOT EXISTS recipe_context JSONB;

ALTER TABLE chat_sessions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(12) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx
    ON chat_messages(user_id, id);

-- Cache persistente das traduções de receitas. A tradução é camada de
-- apresentação e não participa do cálculo do ML.
CREATE TABLE IF NOT EXISTS recipe_translation_cache (
    id_meal VARCHAR(32) PRIMARY KEY,
    original_name TEXT NOT NULL,
    name_pt TEXT,
    category_pt TEXT,
    area_pt TEXT,
    ingredients_pt JSONB,
    preparation_steps_pt JSONB,
    localization_version INTEGER NOT NULL DEFAULT 3,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE recipe_translation_cache
    ADD COLUMN IF NOT EXISTS localization_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE recipe_translation_cache
    ALTER COLUMN localization_version SET DEFAULT 3;
