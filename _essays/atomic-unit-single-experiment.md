---
title: "The Atomic Unit of Scientific Information Is a Single Experiment"
date: 2026-11-17
pdf: /docs/essays/Mathews_2026_Atomic_Unit_Single_Experiment.pdf
keywords: "publication bias, negative results, experimental design, p-values, scientific publishing, essay"
description: "Rewarding robust design is the antidote to the mangled mess that is the published, peer-reviewed scientific corpus today."
published: false

original_title: "The atomic unit of scientific information is a single experiment"
original_date: "2026-11-17"
original: |
  Rewarding robust design is the antidote to the mangled mess that is the published and peer reviewed scientific corpus today

  Having recently completed a phd, a few frustrating experiences across multiple years have culminated in an insight i thought was worth sharing. I believe the atomic unit of scientific information is a single experiment. And for as long as we ignore this fact and do not operate based on it, we’re often shooting ourselves in the foot.

  I’ve just finished writing some thoughts on why peer review should be overhauled - see link. Further malignant regarding the current practice of peer review is the misaligned moulding of scienitifc papers and narratives, with positive publication bias.

  Science is somehow both a stochastic and deterministic process. The scientific method is a torch, lamp, or light in the dark, it lights the way ahead, and hopefully we’re all agreed that forward is the way we’re all travelling.

  However, when we fail to share oru failures, we shoot ourselves and everyone behind us in the foot and doom ourselves to spirals of inefficiency which are now scaling with ai tools. When ai tools - llms, and other machine learning algos - run on the biased, published, scientific corpus, they exemplify our biases, what we choose to include, and remain blind to what we choose to leave out.

  In the scientific method, every result, whether negative, inconclusive, or positive informs the next experiment. We have largely treated ourselves as the only one who needs to learn from our failures when we needed to be sharing any and all results with everyone. A negative experiment points a different way, an inconclusive one drives better design. And it is the robustness and strength of the design that ultimately decides how well the path is lit, not the significant figures of a p value and its magnitude below the 0.05 threshold.

  Rewarding robust design and incentivizing experimental publication may be an antidote to combating the publication bias and the mangled mess that is the published and peer reviewed scientific corpus today. As we begin to scale hypothesis generation and data analyses, it is critical we do not scale our ineffiencies lest we go further off course in our path forward.

editing: >-
  I wrote the original on November 17, 2026, and revised it the same day with editorial help from
  Claude, an AI model made by Anthropic. Claude critiqued the draft, found and checked the sources, and
  drafted edits, some on its own suggestion and some at my direction; I chose what to keep. The Markup
  view shows every change from the original. Every quote in the references is copied word for word from
  the published source.

# Edit log, shown under "Edits". by: who decided it; words: who wrote the new wording.
edits:
  - where: "Title and byline"
    what: "Title case; “published and peer reviewed” became “published, peer-reviewed.”"
    why: "Standard title style and hyphenation."
    by: Claude
  - where: "Throughout"
    what: "Fixed typos (phd, oru, scienitifc, publuished, ineffiencies) and spelled out contractions; “moulding” and “travelling” became the US “molding” and “traveling.”"
    why: "The rest of the site uses US spelling and no contractions."
    by: Claude
  - where: "¶1"
    what: "Recast the first sentence so “I” is the one who completed the PhD."
    why: "The original sentence said the experiences completed the PhD."
    by: Claude
  - where: "¶2"
    what: "“see link” became a link to the peer review essay; the second sentence was rewritten for clarity."
    why: "“Further malignant regarding…” did not parse."
    by: Claude
  - where: "¶2"
    what: "Added the file-drawer finding: strong results are 40 percentage points more likely to be published, mostly because null results are never written up."
    why: "Evidence for publication bias, and for where it happens."
    by: Claude
  - where: "¶4"
    what: "“exemplify our biases” became “amplify our biases”; “algos” became “algorithms”; spelled out AI and LLM terms."
    why: "“Amplify” is the claim the paragraph is making."
    by: Claude
  - where: "¶5"
    what: "Added the American Statistical Association’s principle on p-value thresholds, with a citation."
    why: "Support for the p-value sentence from the statisticians themselves."
    by: Claude
  - where: "¶6"
    what: "New paragraph: registered reports cut positive results from 96% to 44%; journals such as microPublication Biology already publish single experiments; a null result from weak design teaches little."
    why: "Shows that rewarding design works, that the atomic unit is already publishable, and answers the obvious objection."
    by: Claude
  - where: "¶7"
    what: "“incentivizing experimental publication” became “incentivizing the publication of every experiment”; tightened “an antidote to combating.”"
    why: "Clearer; “antidote to combating” doubles the verb."
    by: Claude

references:
  - id: franco2014
    cite: "Franco A, Malhotra N, Simonovits G. Publication bias in the social sciences: unlocking the file drawer. <i>Science</i>. 2014;345(6203):1502–1505."
    url: https://doi.org/10.1126/science.1255484
    quote: "Strong results are 40 percentage points more likely to be published than are null results"
    where: Abstract
  - id: asa2016
    cite: "Wasserstein RL, Lazar NA. The ASA statement on p-values: context, process, and purpose. <i>Am Stat</i>. 2016;70(2):129–133."
    url: https://doi.org/10.1080/00031305.2016.1154108
    quote: "Scientific conclusions and business or policy decisions should not be based only on whether a p-value passes a specific threshold."
    where: Principle 3
  - id: scheel2021
    cite: "Scheel AM, Schijen MRMJ, Lakens D. An excess of positive results: comparing the standard psychology literature with registered reports. <i>Adv Methods Pract Psychol Sci</i>. 2021;4(2)."
    url: https://doi.org/10.1177/25152459211007467
    quote: "we found 96% positive results in standard reports but only 44% positive results in RRs."
    where: Abstract
  - id: raciti2018
    cite: "Raciti D, Yook K, Harris TW, Schedl T, Sternberg PW. Micropublication: incentivizing community curation and placing unpublished data into the public domain. <i>Database</i>. 2018;2018:bay013."
    url: https://doi.org/10.1093/database/bay013
    quote: "results are omitted from science narratives due to publication bias where certain results are considered irrelevant for the publication."
    where: Abstract
---

<p>Having recently completed a PhD, I have found that a few frustrating experiences across multiple years culminated in an insight I thought was worth sharing. I believe the atomic unit of scientific information is a single experiment. And for as long as we ignore this fact and do not operate based on it, we are often shooting ourselves in the foot.</p>

<p>I have just finished writing some thoughts on why <a href="/me/essays/peer-review-scaled-and-continuous/">peer review should be overhauled</a>. Even more malignant in the current practice of peer review is the molding of scientific papers into tidy narratives, with a bias toward publishing positive results. <span class="claim" data-ref="franco2014">Studies with strong results are 40 percentage points more likely to be published than studies with null results, mostly because the null results are never written up</span><sup class="ref"><a href="#ref-franco2014">1</a></sup>.</p>

<p>Science is somehow both a stochastic and a deterministic process. The scientific method is a torch, lamp, or light in the dark: it lights the way ahead, and hopefully we all agree that forward is the way we are all traveling.</p>

<p>However, when we fail to share our failures, we shoot ourselves and everyone behind us in the foot, and doom ourselves to spirals of inefficiency that are now scaling with AI tools. When AI tools, including large language models and other machine learning algorithms, run on the biased, published scientific corpus, they amplify our biases: they learn what we choose to include and remain blind to what we choose to leave out.</p>

<p>In the scientific method, every result, whether negative, inconclusive, or positive, informs the next experiment. We have largely treated ourselves as the only ones who need to learn from our failures, when we needed to be sharing any and all results with everyone. A negative experiment points a different way; an inconclusive one drives better design. And it is the robustness and strength of the design that ultimately decides how well the path is lit, not the significant figures of a p-value and its magnitude below the 0.05 threshold. <span class="claim" data-ref="asa2016">Statisticians agree that scientific conclusions should not rest only on whether a p-value passes a threshold</span><sup class="ref"><a href="#ref-asa2016">2</a></sup>.</p>

<p>Rewarding design already works. <span class="claim" data-ref="scheel2021">When journals agree to publish a study on the strength of its design, before the results are known, the share of positive results falls from 96% to 44%</span><sup class="ref"><a href="#ref-scheel2021">3</a></sup>. And the single experiment is already publishable: <a href="https://www.micropublication.org/">microPublication Biology</a> <span class="claim" data-ref="raciti2018">publishes individual, peer-reviewed findings, including results that would otherwise be left out of a paper’s narrative</span><sup class="ref"><a href="#ref-raciti2018">4</a></sup>. A null result from a weak design teaches little, which is exactly why design, not outcome, is what we should reward.</p>

<p>Rewarding robust design and incentivizing the publication of every experiment may be an antidote to publication bias and to the mangled mess that is the published, peer-reviewed scientific corpus today. As we begin to scale hypothesis generation and data analyses, it is critical we do not scale our inefficiencies, lest we go further off course in our path forward.</p>

*If you are working on this problem, or would like to discuss it further, [please get in touch](/me/#contact).*

Rick Mathews, PhD, is an MD/PhD candidate at the Oregon Health & Science University (OHSU), currently on leave.
