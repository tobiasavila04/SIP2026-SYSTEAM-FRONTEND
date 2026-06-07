const { Pool } = require('pg')
const pool = new Pool({
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.enweqjzmmgxhbsglwbbz',
  password: 'utlWZZJdmXZUlST7',
  ssl: { rejectUnauthorized: false },
})

const action = process.argv[2]
const arg1 = process.argv[3]
const arg2 = process.argv[4]

async function main() {
  if (action === 'list') {
    const { rows } = await pool.query('SELECT id, email, name, saldo_idea FROM users ORDER BY id')
    console.table(rows.map(r => ({ ...r, saldo_idea: Number(r.saldo_idea) })))
  } else if (action === 'credit') {
    const email = arg1
    const amount = parseFloat(arg2)
    if (!email || !amount) { console.error('Usage: credit <email> <amount>'); process.exit(1) }
    const { rows } = await pool.query(
      'UPDATE users SET saldo_idea = COALESCE(saldo_idea, 0) + $1 WHERE email = $2 RETURNING id, email, saldo_idea',
      [amount, email]
    )
    if (rows.length === 0) {
      console.log('User not found')
    } else {
      console.log(`Credited ${amount} $IDEA to ${rows[0].email}. New balance: ${Number(rows[0].saldo_idea)}`)
    }
  } else if (action === 'check') {
    const email = arg1
    if (!email) { console.error('Usage: check <email>'); process.exit(1) }
    const { rows } = await pool.query(
      'SELECT id, email, name, saldo_idea, billetera FROM users WHERE email = $1', [email]
    )
    if (rows.length === 0) {
      console.log('User not found')
    } else {
      console.log(`ID: ${rows[0].id}, Email: ${rows[0].email}, Name: ${rows[0].name}, saldo_idea: ${Number(rows[0].saldo_idea)}, wallet: ${rows[0].billetera || '—'}`)
    }
  } else if (action === 'register-investment') {
    const projectId = parseInt(arg1)
    const montoIdea = parseFloat(arg2)
    const txHash = process.argv[4]
    const userId = parseInt(process.argv[5])
    if (!projectId || !montoIdea || !txHash || !userId) {
      console.error('Usage: register-investment <projectId> <montoIdea> <txHash> <userId>')
      process.exit(1)
    }
    // Check project
    const { rows: proj } = await pool.query('SELECT id, name, monto_recaudado, estado FROM projects WHERE id = $1', [projectId])
    if (proj.length === 0) { console.error('Project not found'); process.exit(1) }
    console.log('Project:', proj[0].name, '| Estado:', proj[0].estado, '| Recaudado:', Number(proj[0].monto_recaudado))

    // Check subtoken
    const { rows: subs } = await pool.query(
      'SELECT id, cupo_restante, precio_base, suministro_total FROM subtokens WHERE proyecto_id = $1', [projectId]
    )
    if (subs.length === 0) { console.error('Subtoken not found for project'); process.exit(1) }
    const sub = subs[0]
    console.log('Subtoken:', sub.id, '| Cupo restante:', sub.cupo_restante, '| Precio base:', Number(sub.precio_base))

    // Calculate subtokens
    const precionActual = sub.precio_base // simplified
    const subTokens = Math.floor(montoIdea / Number(precionActual))
    console.log('Sub-tokens to receive:', subTokens, 'at price', Number(precionActual))

    if (subTokens > sub.cupo_restante) { console.error('Not enough cupo'); process.exit(1) }

    // Check user
    const { rows: user } = await pool.query('SELECT id, saldo_idea FROM users WHERE id = $1', [userId])
    if (user.length === 0) { console.error('User not found'); process.exit(1) }
    console.log('User saldo_idea:', Number(user[0].saldo_idea))
    if (Number(user[0].saldo_idea) < montoIdea) { console.error('Insufficient saldo_idea'); process.exit(1) }

    // Check duplicate txHash
    const { rows: dup } = await pool.query('SELECT COUNT(*) as cnt FROM investments WHERE tx_hash = $1', [txHash])
    if (parseInt(dup[0].cnt) > 0) { console.error('Tx hash already registered'); process.exit(1) }

    // Do all updates in a transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Deduct user saldo
      await client.query('UPDATE users SET saldo_idea = saldo_idea - $1 WHERE id = $2', [montoIdea, userId])

      // Add to monto_recaudado
      await client.query('UPDATE projects SET monto_recaudado = COALESCE(monto_recaudado, 0) + $1 WHERE id = $2', [montoIdea, projectId])

      // Update subtoken cupo
      const nuevoCupo = sub.cupo_restante - subTokens
      await client.query('UPDATE subtokens SET cupo_restante = $1 WHERE id = $2', [nuevoCupo, sub.id])

      // Add portfolio entry
      await client.query(
        'INSERT INTO portfolio (usuario_id, subtoken_id, cantidad, created_at) VALUES ($1, $2, $3, NOW())',
        [userId, sub.id, subTokens]
      )

      // Insert investment
      await client.query(
        `INSERT INTO investments (usuario_id, proyecto_id, monto_idea, sub_tokens_recibidos, tx_hash, estado, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'CONFIRMADA', NOW(), NOW())`,
        [userId, projectId, montoIdea, subTokens, txHash]
      )

      await client.query('COMMIT')
      console.log(`Investment registered successfully!`)
      console.log(`  Proyecto: ${proj[0].name} (#${projectId})`)
      console.log(`  Usuario: #${userId}`)
      console.log(`  Monto: ${montoIdea} $IDEA`)
      console.log(`  Sub-tokens: ${subTokens}`)
      console.log(`  Tx: ${txHash}`)
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } else {
    console.log(`
Usage: node credit-idea.cjs <command>

Commands:
  list                                    List all users
  check <email>                           Check user balance
  credit <email> <amount>                Credit $IDEA to user
  register-investment <pid> <amt> <tx> <uid>  Register a manual on-chain investment
`)
  }
  await pool.end()
}

main().catch(e => { console.error(e.message); process.exit(1) })
