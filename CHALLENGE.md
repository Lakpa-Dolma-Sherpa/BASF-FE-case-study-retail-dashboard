# Case Study for Front End Candidate Assessment

The codebase is created for an internal analytics dashboard used by a retail chain to monitor store performance. The existing app provides authentication, a store overview page with a revenue chart, and a transactions table. 

It is built with **React, Ant Design, SCSS, Redux Toolkit, Axios, AG Grid, and D3.js**. A mock REST server is included in the repo.

Your task is to extend this codebase with a new feature, improve the existing code, and document your decisions.

**What we're evaluating:** Code comprehension, component architecture and state management decisions, attention to detail, and verbal code explanation.

Expected Workload: 8 to 10 hours

---

## Part A: Store Comparison (Feature)

Build a **Store Comparison** page that lets a logged-in user compare the performance of multiple stores over a chosen time range.

### Requirements

**Selection & filters**
- Select **2 to 5 stores** (data for all stores is available via the existing REST API)
- Select a **date range** ("Last 7 days"/"Last 30 days"/etc. or a custom range)
- Filter state must survive a page reload and produce a **shareable URL** (if I send you my link, you see my comparison)

**Comparison chart (D3)**
- A multi-series time chart showing daily revenue per selected store
- Series must be **clearly distinguishable** (proper color coding, spacing), with a legend and a usable tooltip

**Summary table (AG Grid)**
- One row per selected store with aggregates for the chosen range: total revenue, total transactions, average basket size, and % change (compared to the previous period of equal length)
- Sortable, with properly formatted numbers, currencies, and dates
- A visual trend indicator (up/down arrows) for the % change column

**States & quality**
- Loading/empty/error state handling
- Usage of native AG Grid APIs when interacting with filters, the chart, or the grid

**Export**
- A "Download CSV" button that triggers a file download for the data currently visible in the table (respecting active filters).

### Constraints
- Use the existing stack, do not introduce a different charting library, grid, or state manager.
- Follow the existing project structure where it's reasonable, you can deviate where needed. Explanation should follow.

---

## Part B: Codebase Improvements

Review the existing codebase (the overview page, shared components, Redux store, Axios layer, and styles). Make any improvements you consider important for a production deployment. **The codebase contains real problems**.

Each major/minor change should be committed separately, with a descriptive commit message.

---

## Part C: Solutions Document

Write a short document in `SOLUTIONS.md` covering:

1. **Component & state architecture** — What architectural decisions were made while working on Comparison features. Which states were preserved locally, which via Redux.
2. **Chart implementation** — Challenges while integrating D3 plotting library with React, previous experience with plotting libraries (plotly, d3.js, etc). 
3. **User experience and Styling** - What decisions have been made to improve user experience and responsiveness of the app.
4. **Performance** — Where you applied memoization/caching and why.
5. **Codebase review** — Overall descriptions of issues found in the codebase and how they were fixed. Describe further improvement ideas even if not implemented.


---

## Submission Guidelines

- The challenge should be submitted and shared via a developer platform of your choice (Github, Gitlab). 
- As mentioned before, clear commit messages are expected, since a commit history will be reviewed.

## The Live Review During interview (30min)

- **~10 min:** You walk us through your solution and your Part B findings
- **~20 min:** We ask questions about specific parts of your code and your decisions

## AI Usage
The usage of AI tools/assistants is not prohibited in any way. However, the responsibility of the submitted code falls fully on the candidate.

## Misc
Do not update/improve/change back-end code under `/server` folder, the latency and request failures are injected on purpose.
