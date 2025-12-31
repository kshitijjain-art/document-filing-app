const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("database.db");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, `uploads/${req.body.committee}`),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

function generateFileNumber(committee) {
  return new Promise(resolve => {
    db.get(
      "SELECT last_number FROM committee_counter WHERE committee=?",
      [committee],
      (err, row) => {
        const next = row.last_number + 1;
        db.run(
          "UPDATE committee_counter SET last_number=? WHERE committee=?",
          [next, committee]
        );
        resolve(`SCE/CSE/26/${committee}/${String(next).padStart(3,"0")}`);
      }
    );
  });
}

app.post("/submit", upload.single("document"), async (req, res) => {
  const fileNumber = await generateFileNumber(req.body.committee);

  db.run(
    "INSERT INTO documents (committee,file_number,submission_date,document_path) VALUES (?,?,date('now'),?)",
    [req.body.committee, fileNumber, req.file.path]
  );

  res.send(`✅ Submitted Successfully<br>File Number: <b>${fileNumber}</b>`);
});

app.post("/admin-login", (req, res) => {
  req.body.password === "2025"
    ? res.redirect("/admin.html")
    : res.send("❌ Invalid Password");
});

app.get("/export", (req, res) => {
  db.all("SELECT * FROM documents", async (err, rows) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Documents");

    ws.columns = [
      { header: "File Number", key: "file_number" },
      { header: "Committee", key: "committee" },
      { header: "Date", key: "submission_date" },
      { header: "File Path", key: "document_path" }
    ];

    ws.addRows(rows);

    res.setHeader("Content-Disposition","attachment; filename=documents.xlsx");
    await wb.xlsx.write(res);
    res.end();
  });
});

app.listen(process.env.PORT || 3000);

