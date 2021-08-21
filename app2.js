'use strict'

const Hapi = require("@hapi/hapi")
const pool = require('./maria_database_connection/database.js')

const init = async() => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    })

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello World!'
        }
    })

    server.route({
        method: 'GET',
        path: '/maria_database',
        handler: async() => {
            const sqlQuery = 'SELECT * FROM to_do'
            const result = await pool.query(sqlQuery)
            return result
        }               
    })

    server.route({
        method: 'POST',
        path: '/maria_database',
        handler: async(request) => {
            const { task } = request.payload
            const sqlQuery = 'INSERT INTO to_do (task) VALUES(?)'
            const result = await pool.query(sqlQuery, [task])
            return result
        }         
    })

    server.route({
        method: 'DELETE',
        path: '/maria_database',
        handler: async(request) => {
            const { deletedItem } = request.payload
            const sqlQuery = 'DELETE FROM to_do WHERE (task) = (?) ORDER BY id DESC LIMIT 1'
            const result = await pool.query(sqlQuery, [deletedItem])
            return result
        }
    })

    server.route({
        method: 'PUT',
        path: '/maria_database',
        handler: async(request) => {
            const { updated, previous } = request.payload
            const sqlQuery = 'UPDATE to_do SET task = (?) WHERE task = (?) ORDER BY id ASC LIMIT 1'
            const result = await pool.query(sqlQuery, [ updated, previous ])
            return result
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