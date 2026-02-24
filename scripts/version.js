#!/usr/bin/env node
/**
 * Auto-versioning script: v[YYYYMMDD] with a,b,c suffix for same-day builds
 * Run: node scripts/version.js
 */
const fs = require('fs')
const path = require('path')

const today = new Date()
const y = today.getFullYear()
const m = String(today.getMonth() + 1).padStart(2, '0')
const d = String(today.getDate()).padStart(2, '0')
const dateStr = `${y}${m}${d}`

const versionFile = path.join(__dirname, '..', 'lib', 'version.ts')

let suffix = ''
if (fs.existsSync(versionFile)) {
    const current = fs.readFileSync(versionFile, 'utf-8')
    const match = current.match(/v(\d{8})([a-z]?)/)
    if (match && match[1] === dateStr) {
        // Same day — increment suffix
        const prevSuffix = match[2]
        if (!prevSuffix) {
            suffix = 'a'
        } else {
            suffix = String.fromCharCode(prevSuffix.charCodeAt(0) + 1)
        }
    }
}

const version = `v${dateStr}${suffix}`
const content = `export const APP_VERSION = '${version}'\n`

fs.writeFileSync(versionFile, content)
console.log(`Version: ${version}`)
