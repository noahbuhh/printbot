const express = require('express')
const path = require('path')

const app = express()
const port = 3000

// Static dashboard: index.html + /css/* + /js/*
app.use(express.static(path.join(__dirname, 'public')))

app.listen(port, () => console.log(`Web dashboard listening on port ${port}`))
