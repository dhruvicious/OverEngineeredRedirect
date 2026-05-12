import { logger } from "./logger.js";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const DAILY_QUERY = `
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      link
    }
  }
`;

const cache = { link: null, fetchedAt: null };

function isCacheValid() {
  if (!cache.link || !cache.fetchedAt) return false;
  const lastMidnight = new Date();
  lastMidnight.setUTCHours(0, 0, 0, 0);
  return cache.fetchedAt >= lastMidnight.getTime();
}

export function getCacheStatus() {
  return {
    valid: isCacheValid(),
    fetchedAt: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
  };
}

export async function getDailyLink() {
  if (isCacheValid()) {
    logger.debug("Cache hit — returning cached link");
    return cache.link;
  }

  logger.info("Cache miss — fetching from LeetCode");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  let response;
  try {
    response = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query: DAILY_QUERY }),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw Object.assign(new Error("LeetCode request timed out"), { code: "UPSTREAM_TIMEOUT" });
    }
    throw Object.assign(err, { code: "UPSTREAM_NETWORK" });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`LeetCode upstream error: ${response.status}`),
      { code: "UPSTREAM_ERROR", status: response.status }
    );
  }

  const data = await response.json();
  const link = data?.data?.activeDailyCodingChallengeQuestion?.link;

  if (!link) {
    throw Object.assign(
      new Error("Daily challenge link missing in response"),
      { code: "BAD_RESPONSE" }
    );
  }

  cache.link = link;
  cache.fetchedAt = Date.now();
  logger.info({ link }, "Fetched and cached daily link");

  return link;
}