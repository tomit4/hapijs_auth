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
                    const hashedPassword = await bcrypt.hash(req.payload.password, 10);
                    const user = {
                        name: req.payload.username,
                        password: hashedPassword,
                    };
                    const sqlQuery = "INSERT INTO users (username, password) VALUES (?, ?);";
                    const result = await pool.query(sqlQuery, [user.name, hashedPassword]);
                    return result;
                }
            },
            {
                method: "POST",
                path: "/",
                handler: async (req, h) => {

                    // we should reference req.payload.username req.payload.password (input)

                    const sqlQuery = "SELECT * FROM users";
                    const result = await pool.query(sqlQuery);

                    for (let i = 0; i < result.length; i++) { // works, finds the user based off of username... now we have to compare bcrypt passwords...
                        if (req.payload.username === result[i].username) {
                            return result[i]
                        } else {
                            return "No Dice"
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