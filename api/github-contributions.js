// Serverless function: returns the real GitHub contribution calendar
// (last 42 days) using GraphQL. Runs server-side so the token never
// reaches the client. Includes private contributions because the token
// belongs to the profile owner (viewer).
export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: "GITHUB_TOKEN not configured" });
    return;
  }

  const query = `
    query {
      viewer {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`;

  try {
    const gh = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "maksym-trokhymets-portfolio"
      },
      body: JSON.stringify({ query })
    });

    if (!gh.ok) {
      res.status(502).json({ error: `GitHub GraphQL ${gh.status}` });
      return;
    }

    const json = await gh.json();
    const cal =
      json?.data?.viewer?.contributionsCollection?.contributionCalendar;
    if (!cal) {
      res.status(502).json({ error: "Unexpected GraphQL response" });
      return;
    }

    const allDays = cal.weeks.flatMap((w) => w.contributionDays);
    const last42 = allDays.slice(-42).map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: bucket(d.contributionCount)
    }));

    // Cache at the edge for an hour — the graph only changes a few times a day.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ total: cal.totalContributions, days: last42 });
  } catch (err) {
    res.status(502).json({ error: "Fetch failed" });
  }
}

function bucket(count) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}
