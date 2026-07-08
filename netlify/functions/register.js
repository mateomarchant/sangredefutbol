const crypto = require("crypto");
const { getDatabase } = require("@netlify/database");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function ensureUsersTable(db) {
  await db.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      commune TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'email',
      role TEXT NOT NULL DEFAULT 'beta-player',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Metodo no permitido." });
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Solicitud invalida." });
  }

  const name = String(data.name || "").trim();
  const email = normalizeEmail(data.email);
  const commune = String(data.commune || "").trim();
  const password = String(data.password || "");
  const provider = String(data.provider || "email").trim() || "email";

  if (!name || name.length > 120) return json(400, { error: "Ingresa un nombre valido." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "Ingresa un correo valido." });
  if (!commune || commune.length > 120) return json(400, { error: "Ingresa una comuna valida." });
  if (password.length < 6) return json(400, { error: "La contrasena debe tener al menos 6 caracteres." });

  try {
    const db = getDatabase();
    await ensureUsersTable(db);

    const rows = await db.sql`
      INSERT INTO users (name, email, commune, password_hash, provider)
      VALUES (${name}, ${email}, ${commune}, ${hashPassword(password)}, ${provider})
      RETURNING id, name, email, commune, provider, role, created_at
    `;

    return json(201, { user: rows[0] });
  } catch (error) {
    if (String(error.message || "").includes("duplicate key")) {
      return json(409, { error: "Ese correo ya tiene una cuenta. Prueba entrando." });
    }

    return json(500, { error: "No se pudo crear la cuenta. Intentalo nuevamente." });
  }
};
