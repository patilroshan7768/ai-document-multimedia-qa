import logging
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


class WhisperService:
    """Service for transcribing audio/video files using Faster-Whisper."""

    def __init__(self) -> None:
        self._model = None

    def _load_model(self):
        """Lazily load the Whisper model."""
        if self._model is None:
            from faster_whisper import WhisperModel

            logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL_SIZE}")
            self._model = WhisperModel(
                settings.WHISPER_MODEL_SIZE,
                device="cpu",
                compute_type="int8",
            )
            logger.info("Whisper model loaded successfully.")
        return self._model

    def transcribe(self, audio_path: str | Path) -> list[dict]:
        """Transcribe an audio file and return timestamped chunks.

        Args:
            audio_path: Path to the audio file.

        Returns:
            List of dicts with 'text', 'start_time', and 'end_time'.

        Raises:
            ValueError: If transcription fails.
        """
        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise ValueError(f"Audio file not found: {audio_path}")

        logger.info(f"Transcribing audio: {audio_path}")
        model = self._load_model()

        try:
            segments, info = model.transcribe(
                str(audio_path),
                beam_size=5,
                language=None,  # auto-detect
                vad_filter=True,
            )
            logger.info(
                f"Detected language: {info.language} "
                f"(probability: {info.language_probability:.2f})"
            )

            chunks: list[dict] = []
            for segment in segments:
                chunks.append(
                    {
                        "text": segment.text.strip(),
                        "start_time": round(segment.start, 2),
                        "end_time": round(segment.end, 2),
                    }
                )

            logger.info(f"Transcription complete: {len(chunks)} segments.")
            return chunks

        except Exception as exc:
            logger.error(f"Transcription failed for {audio_path}: {exc}")
            raise ValueError(f"Transcription failed: {exc}") from exc


whisper_service = WhisperService()
