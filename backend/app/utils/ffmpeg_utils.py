import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_audio_from_video(video_path: str | Path, output_path: str | Path) -> Path:
    """Extract audio track from a video file using ffmpeg.

    Args:
        video_path: Path to the input video file.
        output_path: Path for the extracted audio (should be .wav).

    Returns:
        Path to the extracted audio file.

    Raises:
        RuntimeError: If ffmpeg fails or is not installed.
        FileNotFoundError: If the video file does not exist.
    """
    video_path = Path(video_path)
    output_path = Path(output_path)

    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg",
        "-y",  # overwrite output
        "-i", str(video_path),
        "-vn",  # no video
        "-acodec", "pcm_s16le",
        "-ar", "16000",  # 16kHz sample rate (optimal for Whisper)
        "-ac", "1",  # mono
        str(output_path),
    ]

    logger.info(f"Extracting audio: {video_path} -> {output_path}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5-minute timeout
        )
        if result.returncode != 0:
            logger.error(f"ffmpeg stderr: {result.stderr}")
            raise RuntimeError(
                f"ffmpeg failed with exit code {result.returncode}: {result.stderr}"
            )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("ffmpeg timed out while extracting audio.") from exc
    except FileNotFoundError as exc:
        raise RuntimeError(
            "ffmpeg is not installed or not found in PATH."
        ) from exc

    logger.info(f"Audio extracted successfully: {output_path}")
    return output_path


def get_media_duration(file_path: str | Path) -> float | None:
    """Get the duration of a media file in seconds using ffprobe.

    Args:
        file_path: Path to the media file.

    Returns:
        Duration in seconds, or None if it cannot be determined.
    """
    file_path = Path(file_path)

    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path),
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and result.stdout.strip():
            return float(result.stdout.strip())
    except Exception as exc:
        logger.warning(f"Could not determine duration for {file_path}: {exc}")

    return None
