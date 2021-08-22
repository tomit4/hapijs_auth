'use strict'

const Hapi = require("@hapi/hapi")
const bcrypt = require('bcrypt')
const pool = require('./maria_database_connection/database.js')

const init = async() => {

    const users = []

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    })

    server.route({
        method: 'GET',
        path: '/',
        handler: async(req, h) => {
            return users
        }
    })

    server.route({
        method: 'GET',
        path: '/users',
        handler: async() => {
            const sqlQuery = 'SELECT * FROM users;'
            const result = await pool.query(sqlQuery)
            return result
        }               
    })

    server.route({
        method: 'POST',
        path: '/users',
        handler: async(req, h) => {
                const hashedPassword = await bcrypt.hash(req.payload.password, 10)
                const user = {
                    name: req.payload.name,
                    password: hashedPassword
                }
                // users.push(user)
                // return "Created User Profile " + hashedPassword
                const sqlQuery = 'INSERT INTO users (username, password) VALUES (?, ?)'
                const result = await pool.query(sqlQuery, [user.name, hashedPassword])
                return result
            
        }         
    })

    server.route({
        method: 'POST',
        path: '/user/login',
        handler: async(req, h) => {
            const user = users.find(user => user.name = req.payload.name)

            if (user == null) {
                return "Cannot Find User"
            }
            try {
                if (await bcrypt.compare(req.payload.password, user.password)) {
                    return "Success"
                } else {
                    return "Not Allowed"
                }
            } catch {
                return "Status 500 Error"
            }
        }
    })

    await server.start()
    console.log('Server running on %s', server.info.uri)

}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()