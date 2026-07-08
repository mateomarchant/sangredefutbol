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

function verifyPassword(password, storedValue) {
  const [salt, storedHash] = String(storedValue || "").split(":");
  if (!salt || !storedHash) return false;

  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
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

  const email = normalizeEmail(data.email);
  const password = String(data.password || "");

  if (!email || !password) {
    return json(400, { error: "Ingresa correo y contrasena." });
  }

  try {
    const db = getDatabase();
    const rows = await db.sql`
      SELECT id, name, email, commune, provider, role, created_at, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return json(401, { error: "Correo o contrasena incorrectos. Revisa los datos e intentalo nuevamente." });
    }

    delete user.password_hash;
    return json(200, { user });
  } catch {
    return json(500, { error: "No se pudo iniciar sesion. Intentalo nuevamente." });
  }
};
