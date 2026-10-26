# Serper replay fixtures

Frozen search-result doubles, not live captures. Brand names and prices are
chosen to exercise budget, skin-type, relevance, and grounding checks; they are
not a price feed and should not be treated as current market data.

The harness patches `serper_search` to return the fixture named by
`case.fixtures.serper`, regardless of the query string. One fixture per case is
enough because no case needs two distinct searches.

Shape is the tool's normal output: a JSON list of `{title, url, snippet}`.
When replacing these with real captures, keep the shape and record the capture
date in `dataset/manifest.json`.
