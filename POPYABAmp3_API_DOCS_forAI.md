# Popyaba MP3 API System

## Overview
- Base URL: `http://localhost:3000/api/popyaba`
- Auth: Frontend password only (no API auth)
- CORS: Specific origins only
- Format: MP3 only, 50MB max
- Frontend password: `nohack1337`

## Allowed Origins
```
http://localhost:3000
http://localhost:3001
https://dev.popism.info
https://popism.info
http://193.186.4.181
https://193.186.4.181
```

## API Endpoints

### 1. Upload MP3
```
POST /api/popyaba/mp3upload
Content-Type: multipart/form-data
Body: FormData with 'file' field

Response:
{
  "success": true,
  "fileName": "Song_1699123456789.mp3",
  "originalName": "Song.mp3", 
  "duration": 180,
  "message": "success"
}
```

### 2. List MP3s
```
GET /api/popyaba/mp3getlist
Query params: minDuration, maxDuration, sortBy, sortOrder, limit, offset

Response:
{
  "success": true,
  "data": [Mp3Item[]],
  "total": number,
  "returned": number,
  "filters": {...}
}
```

### 3. Delete MP3
```
DELETE /api/popyaba/mp3deletebyname
Query: ?fileName=file.mp3
OR JSON: {"fileName": "file.mp3"}

Response:
{
  "success": true,
  "message": "deleted",
  "deletedFile": Mp3Item,
  "remainingCount": number
}
```

## Data Structure
```typescript
interface Mp3Item {
  fileName: string;        // with timestamp
  originalName: string;    // original name
  duration: number;        // seconds
  uploadDate: string;      // ISO date
}
```

## File Storage
```
uploads-popyaba/mp3/
├── mp3list.json
└── *.mp3 files
```

## Security Issues
1. No API authentication
2. CORS bypassable (when origin=null)
3. No rate limiting
4. Timing attacks possible
5. Public deletion endpoint

## Frontend Auth
- URL: `/popyaba-test`
- Password: `nohack1337`
- Session: localStorage 'popyaba-auth'

## File Processing
- Spaces → underscores
- Timestamp appended
- music-metadata for duration
- 50MB limit