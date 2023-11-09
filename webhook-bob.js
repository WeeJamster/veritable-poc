const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const port = 1081;

const payloadsDir = "bob_payloads";

// Ensure the "bob_payloads" directory exists, create it if it doesn't
if (!fs.existsSync(payloadsDir)) {
  fs.mkdirSync(payloadsDir);
}

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Define a route that listens for HTTP POST requests to /topic/:topic
app.post("/topic/:topic", async (req, res) => {
  const { topic } = req.params;
  const payload = req.body;

  if (topic == 'basicmessages') {
    console.log(`Received POST request to /topic/${topic}`);
    console.log("Payload:", payload);
  }

  if (payload && typeof payload.content === 'string') {
    const filename = `payload.txt`; // Create the filename
    const filePath = path.join(payloadsDir, filename);

    // Save the payload content to a file
    fs.writeFileSync(filePath, payload.content);
  }

  res.status(200).send("Webhook received"); // Send a response if needed
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Define an endpoint for SSE log updates
app.get("/log-sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Create a watcher for the log file
  const logFilePath = "./logs/webhook-bob.log"; // Update with the correct log file path
  const watcher = chokidar.watch(logFilePath);

  // Send initial log content to the client
  const initialLogContent = fs.readFileSync(logFilePath, "utf8");
  const initialLogLines = initialLogContent.split("\n");
  for (const line of initialLogLines) {
    if (line.trim() !== "") {
      res.write(`data: ${line}\n\n`);
    }
  }

// Listen for changes to the log file and send updates over SSE
watcher.on("change", path => {
  try {
    const logContent = fs.readFileSync(path, "utf8");
    const logLines = logContent.split("\n");
    for (const line of logLines) {
      if (line.trim() !== "") {
        res.write(`data: ${line}\n\n`);
      }
    }
  } catch (error) {
    // Handle the error here, e.g., log it or take appropriate action
    console.error("Error while sending log updates over SSE:", error);
  }
});

  // // Handle client disconnection
  // res.on("close", () => {
  //   watcher.close();
  //   console.log("Client SSE connection closed.");
  //   });
  });
