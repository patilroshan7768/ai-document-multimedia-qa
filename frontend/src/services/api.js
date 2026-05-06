import axios from 'axios'

// ── Base client ──────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for large files / slow models
  headers: { 'Content-Type': 'application/json' },
})

// ── Response interceptor: normalize errors ───────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred.'
    return Promise.reject(new Error(message))
  }
)

// ── Upload API ────────────────────────────────────────────
/**
 * Upload a file (PDF / MP3 / WAV / MP4 / MOV).
 * @param {File} file
 * @param {(pct: number) => void} onProgress
 * @returns {Promise<{ file_id: string, filename: string, status: string }>}
 */
export const uploadFile = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  }).then((r) => r.data)
}

// ── Chat API ──────────────────────────────────────────────
/**
 * Ask a question about a file.
 * @param {string} fileId
 * @param {string} question
 * @returns {Promise<{ answer: string, timestamp: number|null, source_text: string|null, file_id: string }>}
 */
export const askQuestion = (fileId, question) =>
  api.post('/chat', { file_id: fileId, question }).then((r) => r.data)

// ── Summary API ───────────────────────────────────────────
/**
 * Get or generate summary for a file.
 * @param {string} fileId
 * @returns {Promise<{ file_id: string, summary: string }>}
 */
export const getSummary = (fileId) =>
  api.get(`/summary/${fileId}`).then((r) => r.data)

// ── File Metadata API ─────────────────────────────────────
/**
 * Get metadata for an uploaded file.
 * @param {string} fileId
 * @returns {Promise<object>}
 */
export const getFileMetadata = (fileId) =>
  api.get(`/files/${fileId}`).then((r) => r.data)

// ── Health API ────────────────────────────────────────────
export const getHealth = () =>
  api.get('/health').then((r) => r.data)

export default api
