import fs from 'fs';
import path from 'path';

const API = 'https://kinovi.ai/api/v1';
const KEY = process.env.KINOVI_API_KEY;
if (!KEY) throw new Error('Set KINOVI_API_KEY first');

async function upload(filePath) {
  const fileName = path.basename(filePath);
  const ticketRes = await fetch(`${API}/uploads`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName })
  });
  const ticket = await ticketRes.json();
  if (!ticket.uploadUrl) throw new Error(JSON.stringify(ticket));

  const body = fs.readFileSync(filePath);
  const put = await fetch(ticket.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': ticket.contentType },
    body
  });
  if (!put.ok) throw new Error('Upload failed');
  return ticket.url;
}

async function createTask(imageUrl, prompt) {
  const res = await fetch(`${API}/jobs/createTask`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'seedance-20',
      inputs: {
        prompt: prompt,
        imageUrls: [imageUrl],
        duration: 4,
        outputResolution: "720p",
        aspectRatio: "16:9",
        mode: "keyframe"
      }
    })
  });
  const data = await res.json();
  if (!data.taskId) throw new Error(JSON.stringify(data));
  return data.taskId;
}

async function poll(taskId) {
  while (true) {
    const res = await fetch(`${API}/jobs/recordInfo?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${KEY}` }
    });
    const data = await res.json();
    console.log(data.status, data.creditsUsed ?? '');
    if (data.status === 'success') return data.output[0].url;
    if (data.status === 'fail') throw new Error(JSON.stringify(data.error));
    await new Promise(r => setTimeout(r, 5000));
  }
}

const imagePath = process.argv[2] || 'inputs/image0.jpg';
const prompt = process.argv[3] || 'Slow cinematic camera, natural lighting';

const url = await upload(imagePath);
console.log('Uploaded:', url);
const taskId = await createTask(url, prompt);
console.log('Task:', taskId);
const videoUrl = await poll(taskId);
console.log('Done:', videoUrl);

const video = await fetch(videoUrl);
fs.writeFileSync('output.mp4', Buffer.from(await video.arrayBuffer()));
console.log('Saved output.mp4');

