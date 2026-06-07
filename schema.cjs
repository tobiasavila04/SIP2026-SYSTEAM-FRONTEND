const { Pool } = require('pg')
const pool = new Pool({
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.enweqjzmmgxhbsglwbbz',
  password: 'utlWZZJdmXZUlST7',
  ssl: { rejectUnauthorized: false },
})
;(async () => {
  const { rows } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
  )
  console.log('users columns:')
  rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))

  const { rows: inv } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'investments' ORDER BY ordinal_position`
  )
  console.log('\ninvestments columns:')
  inv.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))

  const { rows: sub } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subtokens' ORDER BY ordinal_position`
  )
  console.log('\nsubtokens columns:')
  sub.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))

  const { rows: port } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'portfolio' ORDER BY ordinal_position`
  )
  console.log('\nportfolio columns:')
  port.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))

  await pool.end()
})()
