const prisma = require('../config/prisma')

const runtimeId = 1
const heartbeatIntervalMs = 60_000
let lastHeartbeatAt = null
let heartbeatTimer = null
let heartbeatQueue = Promise.resolve()

async function startSystemRuntime() {
  const startedAt = new Date()
  await prisma.systemRuntime.upsert({
    where: { id: runtimeId },
    create: {
      id: runtimeId,
      totalRuntimeMs: BigInt(0),
      startedAt,
      lastHeartbeatAt: startedAt,
    },
    update: { startedAt, lastHeartbeatAt: startedAt },
  })

  lastHeartbeatAt = startedAt
  heartbeatTimer = setInterval(() => {
    recordSystemRuntimeHeartbeat().catch((error) => {
      console.error('Unable to record system runtime:', error)
    })
  }, heartbeatIntervalMs)
  heartbeatTimer.unref()
}

function recordSystemRuntimeHeartbeat() {
  const heartbeat = heartbeatQueue.then(async () => {
    if (!lastHeartbeatAt) return

    const heartbeatAt = new Date()
    const elapsedMs = Math.max(0, heartbeatAt.getTime() - lastHeartbeatAt.getTime())
    if (elapsedMs === 0) return

    await prisma.systemRuntime.update({
      where: { id: runtimeId },
      data: {
        totalRuntimeMs: { increment: BigInt(elapsedMs) },
        lastHeartbeatAt: heartbeatAt,
      },
    })
    lastHeartbeatAt = heartbeatAt
  })

  heartbeatQueue = heartbeat.catch(() => {})
  return heartbeat
}

async function getSystemRuntime() {
  const runtime = await prisma.systemRuntime.findUnique({ where: { id: runtimeId } })
  if (!runtime?.startedAt || !runtime.lastHeartbeatAt) {
    throw new Error('System runtime tracking is not active.')
  }

  const now = Date.now()
  return {
    systemRuntimeMs: Math.max(0, now - runtime.startedAt.getTime()),
    overallSystemRuntimeMs: Number(runtime.totalRuntimeMs)
      + Math.max(0, now - runtime.lastHeartbeatAt.getTime()),
  }
}

async function stopSystemRuntime() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (!lastHeartbeatAt) return

  await recordSystemRuntimeHeartbeat()
  await prisma.systemRuntime.update({
    where: { id: runtimeId },
    data: { startedAt: null, lastHeartbeatAt: null },
  })
  lastHeartbeatAt = null
}

module.exports = { getSystemRuntime, startSystemRuntime, stopSystemRuntime }
