"use strict";
const path = require("path");
const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const bcrypt = require("bcrypt");
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
                        const result = await pool.query(sqlQuery, [user.username, hashedPassword]);
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

                    // we should reference req.payload.username req.payload.password (input)

                    const sqlQuery = "SELECT * FROM users";
                    const result = await pool.query(sqlQuery);

                    // better than for loop below... no it isn't, it assigns the name to the first item found, and then just returns that first item with the adjusted password, never mind...
                    // const user = result.find((user) => (user.username = req.payload.username))
                    // if (user) {
                    //     return user
                    // } else {
                    //     return "No Dice"
                    // }


                    // works, but throws a server 500 error if not found, no way thought of to redirect, continue statement necessary,
                    // otherwise any return statement breaks the loop after the first iteration through the users array

                    for (let i = 0; i < result.length; i++) {
                        if (req.payload.username === result[i].username) {
                            return result[i]
                        } else {
                            continue
                        }
                    }

                    // if (await bcrypt.compare(user.password, req.payload.password)) {
                    //     return "Success"
                    // } else {
                    //     return "Not Allowed"
                    // }


                    //     const user = users.find((user) => (user.name = req.payload.name));

                    //     if (user == null) {
                    //         return "Cannot Find User";
                    //     }
                    //     try {
                    //         if (await bcrypt.compare(req.payload.password, user.password)) {
                    //             return "Success";
                    //         } else {
                    //             return "Not Allowed";
                    //         }
                    //     } catch {
                    //         return "Status 500 Error";
                    //     }
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