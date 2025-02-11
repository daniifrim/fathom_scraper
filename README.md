# Fathom Video Scraper

A TypeScript-based tool for automatically scraping and organizing video transcripts and summaries from Fathom meetings.

## Features

- Automated login and authentication with Fathom
- Extracts video metadata (title, date, duration, etc.)
- Captures meeting transcripts and summaries
- Organizes content into readable text files
- Handles multiple video formats and sections
- Robust error handling and retry mechanisms

## Prerequisites

- Node.js (v16 or higher)
- TypeScript
- A Fathom account with access to meetings
- Playwright for browser automation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fathom_scraper.git
cd fathom_scraper
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
FATHOM_EMAIL=your_email@example.com
FATHOM_PASSWORD=your_password
```

## Usage

1. Run the scraper:
```bash
npm start
```

2. The scraper will:
   - Log in to your Fathom account
   - Navigate to the meetings page
   - Extract transcripts and summaries
   - Save them in the `transcripts/` directory

## Project Structure

```
fathom_scraper/
├── src/
│   ├── index.ts        # Entry point
│   ├── scraper.ts      # Main scraping logic
│   ├── auth.ts         # Authentication handling
│   └── storage.ts      # File storage utilities
├── transcripts/        # Output directory
├── dist/              # Compiled JavaScript
└── ...
```

## Configuration

The scraper can be configured through environment variables and command line arguments. See the [documentation](./docs) for more details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Playwright
- Inspired by the need for better meeting documentation
- Thanks to the Fathom team for their great platform 