import logging
from pathlib import Path

import pdfplumber

logger = logging.getLogger(__name__)


class PDFService:
    """Service for extracting text from PDF files."""

    def extract_text(self, file_path: str | Path) -> str:
        """Extract all text from a PDF file.

        Args:
            file_path: Path to the PDF file.

        Returns:
            Extracted text as a single string.

        Raises:
            ValueError: If the file cannot be read or is not a valid PDF.
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise ValueError(f"File not found: {file_path}")

        logger.info(f"Extracting text from PDF: {file_path}")
        text_parts: list[str] = []

        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                    else:
                        logger.debug(f"No text found on page {page_num}")
        except Exception as exc:
            logger.error(f"Failed to extract text from PDF {file_path}: {exc}")
            raise ValueError(f"Could not extract text from PDF: {exc}") from exc

        full_text = "\n".join(text_parts)
        logger.info(
            f"Extracted {len(full_text)} characters from {len(text_parts)} pages."
        )
        return full_text

    def extract_text_by_page(self, file_path: str | Path) -> list[dict]:
        """Extract text from each page separately with page numbers.

        Args:
            file_path: Path to the PDF file.

        Returns:
            List of dicts with 'page' and 'text' keys.
        """
        file_path = Path(file_path)
        pages: list[dict] = []

        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                pages.append({"page": page_num, "text": text})

        return pages


pdf_service = PDFService()
