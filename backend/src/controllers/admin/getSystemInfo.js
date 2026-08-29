function getSystemInfo(request, response) {
  return response.json({
    databaseType: 'PostgreSQL',
    port: Number(process.env.PORT) || 5000,
    backup: 'Available',
  })
}

module.exports = getSystemInfo