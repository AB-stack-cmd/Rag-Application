import express from "express";
import cors from "cors"
import path from "path";
import multer from "multer";
import fs from "fs"

// express app
const app = express();

// Path to join
const pathName = path.join(process.cwd(), "uploads");

// create file if doesnt have
if (!fs.existsSync(pathName)) {
    fs.mkdirSync(pathName, { recursive: true }, (err) => {
        if (err) throw err
    })
};


// storage for multer
const Storage = multer.diskStorage({
    destination: (req, file, cd) => {
        cd(null, pathName);
    },
    filename: (req, file, cd) => {
        const uniqueSuffix = Date.now() + "_" + file.originalname;
        cd(null, uniqueSuffix)
    }
})

// middleware for connection of multer storage
const upload = multer({ storage: Storage })

//cors middleware
app.use(cors({
    origin: 'http://localhost:3000'
}))

app.use(express.json()); // to read JSON body

app.use("/uploads", express.static("uploads"));

// GET route
app.get("/", (req, res) => {
    return res.json({ message: "Hello from GET route" });
});

// POST route
app.post("/upload", upload.single("pdf"), (req, res) => {
    const { name } = req.body;
    const file = req.file;
    console.log("File form client :", file)
    if (!upload) {
        console.log("Multer error")
    }
    res.json({ message: `Hello ${name}, from POST route` });
});

// start server
app.listen(4000, () => {
    console.log("Server running on http://localhost:4000");
});
