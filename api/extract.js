const axios = require("axios");

const cookies = [
  { name: "lang", value: "en" },
  { name: "_ga_06ZNKL8C2E", value: "GS2.1.s1747827696$o12$g1$t1747827711$j45$l0$h0$ds6LiNfPEi1we_hlFO3Y4kKJ3RW-dfyec2w" },
  { name: "ndus", value: "YedI9dkpeHuibGhnx1gUp99nMcjlWooPG6ef-lrV" },
  { name: "_ga", value: "GA1.1.1295200477.1746608415" },
  { name: "__bid_n", value: "196a12d0b28225a5044207" },
  { name: "browserid", value: "leUUutLufGzrPwIgtBII7GeuvemuUpzJJo5K6eWhA9Rby_yMEpLuRyy0zuA=" },
  { name: "ndut_fmt", value: "59A96712A29E5A45E2A48AF773663272C567C7BB46BA882655B8F2FD986A79FD" },
];

// Format cookies for header
const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

async function extractDownloadLink(fileURL) {
  try {
    // First attempt from HTML
    const res = await axios.get(fileURL, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // to avoid bot-detect
      },
    });

    // Extract direct link
    const match = res.data.match(/"dlink":"(http[^"]+)"/);
    if (match) {
      return match[1].replace(/\\u0026/g, "&"); // Unescaping
    }

    // Fallback to API
    console.log("dlink not found in HTML. Trying fallback.");

    // Often their API endpoint is this:
    // (this might break or expire; it's reverse-engineered)
    // Provide your fallback API here:

    const fallback = await axios.post("https://www.terabox.com/rest/share/info", {
      shorturl: fileURL.split('/')[4],
    }, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // to avoid bot-detect
        "Content-Type": "application/json",
      },
    });

    if (fallback.data && fallback.data.link) {
      return fallback.data.link;
    }

    return null;

  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({error:'URL is missing'})
    return;
  }

  if (!url.startsWith("https://d.1024terabox.com/file/") &&
      !url.startsWith("https://terabox.com/sharelinks/") &&
      !url.startsWith("https://1024terabox.com/sharelinks/")) {
    res.status(400).json({error:'Invalid or unsupported URL'})
    return;
  }

  const directLink = await extractDownloadLink(url.trim());

  if (directLink) {
    res.json({directLink, credit: "Dev @Labani"});
  } else {
    res.status(500).json({error:'Unable to extract direct link'})
  }
};

