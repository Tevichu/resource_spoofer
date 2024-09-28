const { execSync } = require('child_process')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const error = '\x1b[31m'
const success = '\x1b[32m'
const random_port = Math.floor(Math.random() * (65535 - 49152) + 49152)
const fake_resources = require('./fake_resources.json')
let saved_body

const resource_path = GetResourcePath(GetCurrentResourceName())
const fivem_ips = [
    '164.132.207.166',
    '176.31.236.143',
    '178.33.224.212',
    '5.135.143.71'
]

function block_ip(ip) {
    try {
        execSync(`netsh advfirewall firewall add rule name="block_${ip}" dir=in action=block remoteip=${ip}`)
        return true
    } catch (e) {
        return false
    }
}

function show_error(msg) {
    setInterval(() => { // make sure all retards see the error
        console.log(`${error}${msg}`)
    }, 1000)
}

(async() => {
    const installed = fs.existsSync(`${resource_path}/installed`)
    if (!installed) {
        for (let i = 0; i < fivem_ips.length; i++) {
            const blocked = block_ip(fivem_ips[i])
            if (!blocked) {
                show_error('Error blocking fivem IPs, run the server as administrator')
                return
            }
        }

        fs.writeFileSync(`${resource_path}/installed`, '')
    }
})()

setInterval(async() => { // spam heartbeats for the masterlist ignore the real ones
    if (saved_body) {
        saved_body['fallbackData']['info']['resources'] = fake_resources
        axios.post('https://servers-ingress-live.fivem.net/ingress', saved_body)
    }
}, 1000)

const app = express()
app.use(bodyParser.json({ limit: '500mb' }))

app.post('/ingress', (req, res) => {
    saved_body = req.body
    res.send('lol')
})

app.listen(random_port, () => {
    console.log(`${success}Spoofed ingress server running on port ${random_port}`)
    const currentEndpoint = GetConvar('sv_master1')
    if (currentEndpoint === 'https://servers-ingress-live.fivem.net/ingress') {
        SetConvar('sv_master1', `http://localhost:${random_port}/ingress`)
    }
})