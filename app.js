"use strict";
const path = require("path");
const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken")
const pool = require("./maria_database_connection/database.js");

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: "localhost",
        routes: {
            cors: true,
            files: {
                relativeTo: path.join(__dirname, "static"),
            },
        },
    });

    // Hapi Plugin Registrations

    await server.register([{
        plugin: Inert,
    }, ]);

    server.route(
        [{
                method: "GET",
                path: "/",
                handler: async (req, h) => {
                    return h.file("./login.html");
                }
            },
            {
                method: "GET",
                path: "/create_user",
                handler: async (req, h) => {
                    return h.file("./create_user.html")
                }
            },
            {
                method: "POST",
                path: "/create_user",
                handler: async (req, h) => {
                    if (req.payload.username !== "" && req.payload.password !== "") {
                        const hashedPassword = await bcrypt.hash(req.payload.password, 10);
                        const user = {
                            username: req.payload.username,
                            password: hashedPassword,
                        };
                        const sqlQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
                        await pool.query(sqlQuery, [user.username, hashedPassword]);
                        return h.redirect("/success")
                    } else {
                        return h.redirect("/")
                    }
                }
            },
            {
                method: 'GET',
                path: '/success',
                handler: (request, h) => {
                    return h.file("./success_create.html")
                }
            },
            {
                method: 'GET',
                path: '/{any*}',
                handler: (request, h) => {
                    return h.file("./404.html")
                }
            },
            {
                method: "GET",
                path: "/users",
                handler: async () => {
                    const sqlQuery = "SELECT * FROM users;";
                    const result = await pool.query(sqlQuery);
                    return result;
                }
            },
            {
                method: "POST",
                path: "/users",
                handler: async (req, h) => {
                    const user = {
                        username: req.payload.username,
                        password: hashedPassword,
                    };
                    const hashedPassword = await bcrypt.hash(req.payload.password, 10)
                    const sqlQuery = "INSERT INTO users (username, password) VALUES (?, ?);";
                    const result = await pool.query(sqlQuery, [user.name, hashedPassword]);
                    return result;
                }
            }, {
                method: "POST",
                path: "/",
                handler: async (req, h) => {

                    const sqlQuery = "SELECT * FROM users";
                    const result = await pool.query(sqlQuery);

                    // Finds the user by name, if found, compares password hash in database to user entered password, if correct, returns succesful login, otherwise returns incorrect
                    let finalResult = undefined
                    for (let i = 0; i < result.length; i++) {
                        if (req.payload.username === result[i].username) { // if the user passes use a username, check to see if that username exists within the database...
                            let correctPassword = await bcrypt.compare(req.payload.password, result[i].password) // if it doesn, then compare the hashed password to the user's entered password...
                            if (correctPassword) {
                                finalResult = result[i]
                            }
                        } else {
                            continue
                        }
                    }
                    if (finalResult !== undefined) {
                        // here is where we might want to generate two tokens, a JWT Authentication Token and also a JWT Refresh Token for our user session.
                        // generate random string tokens using node and the following command:
                        // generated using nodeJS by require('crypto').randomBytes(64).toString('hex')
                        // function generateAccessToken(user) {
                            //     return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                        //         expiresIn: '1m'
                        //     })
                        // }
                        return finalResult // Successful login
                    } else {
                        return "No Dice" // unsuccessful login
                    }

                }
            }
        ])

    await server.start();
    console.log("Server running on %s", server.info.uri);
}




process.on("unhandledRejection", (err) => {
    console.log(err);
    process.exit(1);
});

init();