# Picks candidates

For the page pass. Cut each part to 4 to 6 picks (at least 2 videos), then delete this file. Each line gives the author, the year and the kind. It also says why it passes the bar in STANDARD-v2 section 5. Links are not added here: the page pass adds them and the nightly link check confirms they are live. Years are the first publication year as best known; confirm when linking.

## Orientation (meet Kestrel, the Claude Code ladder)

1. Anthropic, "Best practices for Claude Code", docs, 2025. Official docs by the makers; stays current.
2. Anthropic, "Claude Code overview", docs, 2025. Official; names the features the ladder uses.
3. Anthropic Engineering, "Claude Code: Best practices for agentic coding", blog, 2025. Written by the team that built the tool.
4. Anthropic Engineering, "Building effective agents", blog, 2024. The idea of workflows versus agents; evergreen.
5. Addy Osmani, "Beyond the 70%: maximizing the human edge in AI-assisted coding", essay, 2025. Osmani leads Chrome engineering at Google; source of the ladder levels.
6. Boris Cherny (Anthropic), talk on how Claude Code is built and used, 2025. Made by the tool's creator (video).
7. Anthropic, "Claude Code in action" and the course videos, 2025. Official walkthrough (video).
8. Simon Willison, "Designing agentic loops", blog, 2025. Long-time practitioner and tool author; about the idea.

## Part 1: Ready the repo

1. Anthropic, "Memory and CLAUDE.md", docs, 2025. Official docs for the file this step writes.
2. Anthropic, "Claude Code settings and permissions", docs, 2025. Official; the deny and ask rules.
3. Anthropic Engineering, "Claude Code best practices", blog, 2025. The CLAUDE.md length and content advice, from the team.
4. agents.md project, "AGENTS.md", spec site, 2025. Shared format written by the tools' makers.
5. Anthropic, "Claude Code: How we use it internally", talk or post, 2025. Run in production by the maker (video).
6. Simon Willison, "Agentic coding setup notes", blog, 2025. Practitioner with real repos.
7. Anthropic, "Claude Code sandboxing", engineering post, 2025. Why deny rules and a sandbox both matter.
8. Google SRE, "Embracing risk" chapter, SRE book, 2016. Original source of the error budget idea Kestrel's contract uses; evergreen.

## Part 2: Plan the change

1. Teresa Torres, "Continuous Discovery Habits", book and talks, 2021. Author of the method; about the idea.
2. Marty Cagan, "Inspired" and SVPG articles on product problems, 2017. Method author.
3. Intercom, "Intercom on Jobs-to-be-Done", Intercom blog, 2016. A company that runs it in production.
4. Amazon, "Working backwards", Amazon news and Colin Bryar and Bill Carr, 2021. Method from the people who run it.
5. Basecamp, "Shape Up: Write the pitch", book, 2019. Free, by the team that uses it.
6. Anthropic, "Explore, plan, code, commit" section of the best practices page, 2025. Official; plan first.
7. Julia Evans, "How to ask good questions", blog, 2014. Clear and about the idea.
8. Tom Gilb, "Planguage" and "Competitive Engineering" on measurable requirements, 2005. Original author.

## Part 3: Design the change

1. Anthropic, "Agent Skills", docs, 2025. Official; the contract skill step.
2. Michael Nygard, "Documenting architecture decisions", blog, 2011. The original paper for decision records.
3. MADR project, "Markdown Architectural Decision Records", site, 2022. Maintainers' own docs for the shape used here.
4. Dan North, "Introducing BDD", blog, 2006. Original author of WHEN and THEN style.
5. Martin Fowler, "Specification by Example", bliki, 2010. Long-standing practitioner source.
6. Thoughtworks Technology Radar, "Spec-driven development", 2025. Published by a firm that runs it with clients.
7. GitHub, "Spec Kit" intro by the GitHub team, 2025. Made by the tool's makers (video or post).
8. Gojko Adzic, "Impact Mapping" talk, 2012. Method author (video).

## Part 4: Build the change

1. Kent Beck, "Test-Driven Development by Example", book, 2002. Original author.
2. Martin Fowler, "Test Driven Development", bliki, 2023. Short, evergreen.
3. Anthropic Engineering, "Claude Code best practices", blog, 2025. Names test-first with Claude as a workflow.
4. Anthropic, "Hooks guide", docs, 2025. Official; the test lock and gates use hooks.
5. Anthropic, "Common workflows: git worktrees", docs, 2025. Official; parallel slices.
6. Anthropic, "Plan mode", docs, 2025. Official.
7. Google Engineering Practices, "Small CLs", docs, 2019. Run in production at Google.
8. Trunk Based Development site, "Short-lived feature branches", Paul Hammant, 2017. Method author.
9. Simon Willison, "Red/green TDD with agents", blog, 2025. Practitioner; about the idea.

## Part 5: Review the change

1. Google Engineering Practices, "How to do a code review", docs, 2019. Run in production at Google.
2. Google, "The standard of code review", docs, 2019. Names what blocks a change.
3. Anthropic, "Claude Code subagents", docs, 2025. Official; the reviewer agent.
4. Anthropic, "Claude Code GitHub Actions", docs, 2025. Official; review in CI.
5. Anthropic, "Automated security reviews in Claude Code", blog, 2025. Official; the security review command.
6. OWASP, "Code Review Guide", project docs, 2017. Standards body.
7. Microsoft Research, "Expectations, outcomes, and challenges of modern code review", paper, 2013. Original study, still cited.
8. SmartBear and Cisco, "Best practices for peer code review" study, 2007. Original data on review size.

## Part 6: Release the change

1. Jez Humble and David Farley, "Continuous Delivery", book, 2010. Method authors.
2. Google SRE Workbook, "Canarying releases", 2018. Run in production.
3. Google SRE book, "Release engineering", 2016. Run in production.
4. Keep a Changelog, Olivier Lacan, 2014. Method site by its author.
5. Anthropic, "Claude Code hooks and permissions for deploy safety", docs, 2025. Official.
6. Martin Fowler, "Feature toggles", bliki, 2017. Practitioner and original writer.
7. DORA, "Capabilities: continuous delivery", dora.dev, 2023. Research team that made the method.
8. Charity Majors, talk on deploying on Fridays and ownership, 2019. Runs it in production (video).

## Part 7: Learn from the incident

1. Google SRE book, "Postmortem culture: learning from failure", 2016. Run in production.
2. John Allspaw, "Blameless PostMortems and a just culture", Etsy blog, 2012. Original source.
3. Sidney Dekker, "The Field Guide to Understanding Human Error", book, 2006. Original author.
4. Atlassian, "Incident postmortem templates and handbook", 2020. Company runs it daily.
5. PagerDuty, "Incident response documentation", open docs, 2018. Run in production.
6. Richard Cook, "How complex systems fail", paper, 1998. Original; evergreen.
7. Learning from Incidents community, talks, 2020. Practitioners (video).
8. Anthropic, "A postmortem of three recent issues", engineering post, 2025. A real postmortem by the tool's maker.

## Part 8: Run the team

1. DORA, "Accelerate State of DevOps report", Google Cloud, 2024. The research team that made the four keys.
2. Nicole Forsgren, Jez Humble, Gene Kim, "Accelerate", book, 2018. Method authors.
3. DORA, "Four keys project", GitHub and dora.dev, 2020. Made by the team that runs it.
4. Anthropic, "How Anthropic teams use Claude Code", report, 2025. By the maker.
5. Doctolib customer story on Claude Code, Anthropic site, 2026. Named company results; the number is cited in Part 8.
6. Spotify Engineering, "Squad health check model", 2014. Run in production.
7. Charity Majors, "Engineering management: the pendulum", blog, 2017. Practitioner.
8. Google, "Project Aristotle" on team effectiveness, re:Work, 2015. Original research.
9. Anthropic, "Claude Code headless and the SDK", docs, 2025. Official; running unattended.
10. Anthropic, "Claude Code GitHub Actions", docs, 2025. Official; a team playbook can run on schedule.

## Part 9: Roll out a change slowly

1. OpenFeature, "Introduction" and spec, openfeature.dev, 2022. The standard's own docs (CNCF project).
2. flagd docs, flagd.dev, 2023. Maintainers' docs.
3. Pete Hodgson, "Feature Toggles (aka Feature Flags)", martinfowler.com, 2017. Original long-form source.
4. Google SRE Workbook, "Canarying releases", 2018. Run in production.
5. LaunchDarkly, "Progressive delivery" guide, 2020. Company that runs a flag service.
6. Netflix Tech Blog, "Automated canary analysis at Netflix", 2018. Run in production.
7. Argo Rollouts docs, progressive delivery, 2020. Maintainers' docs.
8. Charity Majors, "Test in production" talk, 2019. Practitioner (video).
