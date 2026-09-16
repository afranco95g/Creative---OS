// Script de un solo uso: fuerza una contraseña nueva para una cuenta,
// usando la Secret key de Supabase (poder de administrador).
// NO subir este archivo a git. Borrar después de usarlo.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const EMAIL = process.env.RESET_EMAIL;
const NUEVA_PASSWORD = process.env.RESET_NUEVA_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !EMAIL || !NUEVA_PASSWORD) {
  console.error(
    'Faltan variables de entorno. Necesitas: SUPABASE_URL, SUPABASE_SECRET_KEY, RESET_EMAIL, RESET_NUEVA_PASSWORD'
  );
  process.exit(1);
}

if (NUEVA_PASSWORD.length < 8) {
  console.error('La contraseña nueva debe tener al menos 8 caracteres.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function main() {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('email', EMAIL)
    .maybeSingle();

  if (profileError) {
    console.error('Error buscando el perfil:', profileError.message);
    process.exitCode = 1;
    return;
  }

  if (!profile) {
    console.error(`No se encontró ningún perfil con el correo ${EMAIL}`);
    process.exitCode = 1;
    return;
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    profile.id,
    { password: NUEVA_PASSWORD }
  );

  if (updateError) {
    console.error('Error actualizando la contraseña:', updateError.message);
    process.exitCode = 1;
    return;
  }

  console.log(`Listo. La contraseña de ${EMAIL} fue actualizada.`);
  console.log('Ya puedes entrar a /login con esa cuenta y la contraseña nueva.');
}

main();
