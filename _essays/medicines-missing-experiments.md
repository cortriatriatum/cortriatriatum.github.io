---
title: "Medicine’s Missing Experiments"
date: 2026-11-16
updated: 2026-11-17
pdf: /docs/essays/Mathews_2026_Medicines_Missing_Experiments.pdf
keywords: "physician-scientist, clinical evidence, translational research, biodesign, essay"
description: "Scientists and engineers stand to benefit from improved clinical contextual awareness."

# Provenance. The original is shown on the page under "Original", compared word by word under "Markup",
# and printed in the PDF appendix. Never edit it after publishing.
original_date: "2026-11-16"
original: |
  Every day, physicians encounter patients in circumstances that raise questions no scientific experiment or trial has investigated. Where evidence does exist, it often ranks low on the hierarchy that ranges from high-quality randomized trials to the lower rungs of expert opinion. Improving evidence quality for clinical decisions will directly impact clinical outcomes.

  For clinical questions and decisions to benefit from scientific experimentation, scientists must first be made aware of these questions within their appropriate clinical context. However, most scientists are not aware of broad swaths of clinical questions that could benefit from scientific experiments. This is because physicians are rarely the ones conducting benchtop science and researchers are rarely the ones treating patients at the bedside. Physician-scientists, who are trained in both environments, are a minority of the workforce and are resource intensive to train. Physician-scientist trainees average over eight years to obtain both an MD and a PhD. This follows a four-year undergraduate degree and precedes three to seven years of additional residency training prior to independent clinical practice. Therefore, physician-scientists are not a scalable solution in bridging benchtop science to the patient bedside. As a result, the majority of biomedical researchers remain unaware of the clinical questions and decisions made during routine clinical management of their disease of interest.

  Several programs attempt to bridge this gap; however, no solution has bridged the clinic to the laboratory at scale. Medical research remains blind to broad swaths of clinical questions, and a large number of clinical decisions today rely on suboptimal quality of evidence for everyday clinical decisions.

# What changed between the original and this version, and who did it.
editing: >-
  I wrote the original on November 16, 2026. On November 17 I revised it with editorial help from
  Claude, an AI model made by Anthropic. Claude critiqued the draft, found and checked the sources, and
  drafted edits, some on its own suggestion and some at my direction; I chose what to keep. The Markup
  view shows every change from the original. Every quote in the references is copied word for word from
  the published source.

# Edit log, shown under "Edits". by: who decided it; words: who wrote the new words.
edits:
  - where: "¶1"
    what: "Added that across U.S. guidelines in several specialties, a minority of recommendations rests on the strongest evidence and nearly half or more on weaker evidence, with three citations (cardiology, oncology, infectious diseases)."
    why: "Gives evidence for “ranks low on the hierarchy.” Wording from my earlier draft; replaced Claude’s cardiology-only sentence."
    by: Rick
  - where: "¶1"
    what: "“will directly impact clinical outcomes” became “will change clinical outcomes.”"
    why: "Claude had softened this to “a necessary step toward improving”; I restored my claim in plainer words."
    by: Rick
  - where: "¶2"
    what: "Added “Clinical uncertainty is itself a rich source of scientific questions. However, …”"
    why: "States the premise of the essay outright."
    by: Rick
    words: Claude
  - where: "¶2"
    what: "“However, most scientists” became “Yet most scientists.”"
    why: "Avoids two sentences in a row starting with “However.”"
    by: Claude
  - where: "¶2"
    what: "“scientists” became “scientists and engineers”; added “or building devices.”"
    why: "The essay is addressed to engineers as well as researchers."
    by: Rick
    words: Claude
  - where: "¶2"
    what: "“This is because” became “This is partly because”; added “few have both skill sets, and fewer still have dedicated time to do both tasks well.”"
    why: "Separation is one cause among several. The added clause is from my earlier draft."
    by: Rick
  - where: "¶2"
    what: "Added that physicians’ insight into clinical context may inform innovation in science, engineering and capital allocation, citing the Wall Street Journal on healthcare venture studios."
    why: "Physicians defining needs from clinical context is already driving company building."
    by: Rick
  - where: "¶2"
    what: "Added the patient and clinician research-priority mismatch, with a citation."
    why: "Evidence that research questions and clinical questions really do diverge."
    by: Claude
  - where: "¶3"
    what: "“are a minority of the workforce” became “make up a single-digit minority of the workforce,” with a citation (1.5%)."
    why: "Wording from my earlier draft."
    by: Rick
  - where: "¶3"
    what: "“average over eight years” became “average about eight years,” with a citation."
    why: "The source reports 8.0 years."
    by: Claude
  - where: "¶3"
    what: "Added “are essential, but they” before “are not a scalable solution.”"
    why: "Keeps the point about scale from reading as a dismissal of physician-scientists."
    by: Claude
  - where: "¶3"
    what: "“the majority of biomedical researchers” became “many biomedical researchers.”"
    why: "No source measures the majority claim."
    by: Claude
  - where: "¶4"
    what: "Named the NIH Clinical and Translational Science Awards and the James Lind Alliance."
    why: "“Several programs” was vague."
    by: Claude
  - where: "¶4"
    what: "Added Stanford Biodesign, with a citation."
    why: "The engineering counterpart: training that starts from unmet clinical needs."
    by: Rick
    words: Claude
  - where: "¶4"
    what: "Added that there is no shared, standardized map of clinical questions, and what such a map would do."
    why: "The missing infrastructure, in my words from an earlier draft."
    by: Rick
  - where: "¶4"
    what: "Final sentence shortened (“a large number of clinical decisions today rely on suboptimal quality of evidence for everyday clinical decisions”)."
    why: "Removed the repeated “clinical decisions.”"
    by: Claude
  - where: "Throughout"
    what: "Serial (Oxford) commas made consistent."
    why: "Consistent style."
    by: Claude
  - where: "Removed"
    what: "Cut Claude’s additions: questions-per-patient figure, declining workforce, longer training, and a closing paragraph on the evidence-to-practice gap."
    why: "Kept the essay short and ending on the problem."
    by: Rick

# References, in order of first citation. `quote` is verbatim from `where`.
references:
  - id: delfiol2014
    cite: "Del Fiol G, Workman TE, Gorman PN. Clinical questions raised by clinicians at the point of care: a systematic review. <i>JAMA Intern Med</i>. 2014;174(5):710–718."
    url: https://doi.org/10.1001/jamainternmed.2014.368
    quote: "The mean frequency of questions raised was 0.57 (95% CI, 0.38-0.77) per patient seen"
    where: Abstract, Results
  - id: fanaroff2019
    cite: "Fanaroff AC, Califf RM, Windecker S, Smith SC Jr, Lopes RD. Levels of evidence supporting American College of Cardiology/American Heart Association and European Society of Cardiology guidelines, 2008–2018. <i>JAMA</i>. 2019;321(11):1069–1080."
    url: https://doi.org/10.1001/jama.2019.1122
    quote: "248 recommendations (8.5%) were classified as LOE A, 1465 (50.0%) as LOE B, and 1217 (41.5%) as LOE C."
    where: Abstract, Results (cardiology)
  - id: poonacha2011
    cite: "Poonacha TK, Go RS. Level of scientific evidence underlying recommendations arising from the National Comprehensive Cancer Network clinical practice guidelines. <i>J Clin Oncol</i>. 2011;29(2):186–191."
    url: https://doi.org/10.1200/JCO.2010.31.6414
    quote: "Recommendations issued in the NCCN guidelines are largely developed from lower levels of evidence but with uniform expert opinion."
    where: Abstract, Conclusion (oncology)
  - id: lee2011
    cite: "Lee DH, Vielemeyer O. Analysis of overall level of evidence behind Infectious Diseases Society of America practice guidelines. <i>Arch Intern Med</i>. 2011;171(1):18–22."
    url: https://doi.org/10.1001/archinternmed.2010.482
    quote: "More than half of the current recommendations of the IDSA are based on level III evidence only."
    where: Abstract, Conclusions (infectious diseases)
  - id: wsj
    cite: "Venture studio model gains traction in healthcare. <i>The Wall Street Journal</i> (WSJ Pro Venture Capital)."
    url: https://www.wsj.com/pro/venture-capital/venture-studio-model-gains-traction-in-healthcare-91ce7f69
    quote: ""
    where: ""
  - id: crowe2015
    cite: "Crowe S, Fenton M, Hall M, Cowan K, Chalmers I. Patients’, clinicians’ and the research communities’ priorities for treatment research: there is an important mismatch. <i>Res Involv Engagem</i>. 2015;1:2."
    url: https://doi.org/10.1186/s40900-015-0003-x
    quote: "There is some evidence that there is a mismatch between what patients and health professionals want to see researched and the research that is actually done."
    where: Plain English summary
  - id: milewicz2015
    cite: "Milewicz DM, Lorenz RG, Dermody TS, Brass LF. Rescuing the physician-scientist workforce: the time for action is now. <i>J Clin Invest</i>. 2015;125(10):3742–3747. Reporting the NIH Physician-Scientist Workforce Working Group report (2014)."
    url: https://doi.org/10.1172/JCI84170
    quote: "only 14,000 (1.5%) consider research to be their primary focus"
    where: Article text
  - id: brass2010
    cite: "Brass LF, Akabas MH, Burnley LD, Engman DM, Wiley CA, Andersen OS. Are MD-PhD programs meeting their goals? An analysis of career choices made by graduates of 24 MD-PhD programs. <i>Acad Med</i>. 2010;85(4):692–701."
    url: https://doi.org/10.1097/ACM.0b013e3181d3ca17
    quote: "The average program enrolled 90 trainees, required 8.0 years to complete, and had an attrition rate of 10%."
    where: Abstract, Results
  - id: yock2015
    cite: "Yock PG. Needs-based innovation: the biodesign process. <i>BMJ Innov</i>. 2015;1(1):3."
    url: https://doi.org/10.1136/bmjinnov-2014-000024
    quote: "a focus on needs-based innovation has emerged as an alternate strategy for medical product development"
    where: Article text
---

<p><span class="claim" data-ref="delfiol2014">Every day, physicians encounter patients in circumstances that raise questions no scientific experiment or trial has investigated.</span><sup class="ref"><a href="#ref-delfiol2014">1</a></sup> Where evidence does exist, it often ranks low on the hierarchy that ranges from high-quality randomized trials to the lower rungs of expert opinion. <span class="claim" data-ref="fanaroff2019">Across major U.S. guidelines in multiple medical specialties, a minority of recommendations rests on the strongest types of evidence while nearly half or more rest on weaker types of evidence</span><sup class="ref"><a href="#ref-fanaroff2019">2</a></sup><sup class="ref">,</sup><sup class="ref"><a href="#ref-poonacha2011">3</a></sup><sup class="ref">,</sup><sup class="ref"><a href="#ref-lee2011">4</a></sup>. Improving evidence quality for clinical decisions will change clinical outcomes.</p>

<p>Clinical uncertainty is itself a rich source of scientific questions. However, for clinical questions and decisions to benefit from scientific experimentation, scientists and engineers must first be made aware of these questions within their appropriate clinical context. Yet most scientists and engineers are not aware of broad swaths of clinical questions that could benefit from scientific experiments. This is partly because physicians are rarely the ones conducting benchtop science or building devices, and researchers and engineers are rarely the ones treating patients at the bedside: few have both skill sets, and fewer still have dedicated time to do both tasks well. <span class="claim" data-ref="wsj">Physicians therefore have unique, informed insight into this clinical context, which may be powerful in informing innovation, not just in science but in engineering and capital allocation decisions</span><sup class="ref"><a href="#ref-wsj">5</a></sup>. <span class="claim" data-ref="crowe2015">When patients and clinicians are asked what they want studied, their priorities differ sharply from the research actually being done</span><sup class="ref"><a href="#ref-crowe2015">6</a></sup>.</p>

<p><span class="claim" data-ref="milewicz2015">Physician-scientists, who are trained in both environments, make up a single-digit minority of the workforce</span><sup class="ref"><a href="#ref-milewicz2015">7</a></sup> and are resource intensive to train. <span class="claim" data-ref="brass2010">Physician-scientist trainees average about eight years to obtain both an MD and a PhD</span><sup class="ref"><a href="#ref-brass2010">8</a></sup>. This follows a four-year undergraduate degree and precedes three to seven years of additional residency training prior to independent clinical practice. Therefore, physician-scientists are essential, but they are not a scalable solution in bridging benchtop science to the patient bedside. As a result, many biomedical researchers remain unaware of the clinical questions and decisions made during routine clinical management of their disease of interest.</p>

<p>Several programs attempt to bridge this gap. The NIH’s <a href="https://ncats.nih.gov/ctsa">Clinical and Translational Science Awards</a> fund institutional hubs for translational research, and the <a href="https://www.jla.nihr.ac.uk/">James Lind Alliance</a> brings patients, carers, and clinicians together to set research priorities<sup class="ref"><a href="#ref-crowe2015">6</a></sup>. For engineers, <a href="https://biodesign.stanford.edu/">Stanford Biodesign</a> <span class="claim" data-ref="yock2015">trains fellows to start from unmet clinical needs rather than from a technology in search of a use</span><sup class="ref"><a href="#ref-yock2015">9</a></sup>. Yet no solution has bridged the clinic to the laboratory at scale, in part because there is no shared, standardized map of clinical questions that need better guiding evidence. Such a map would tie each study to a clinically relevant question and reveal which of those questions need better scientific evidence to guide their key decisions. Medical research remains blind to broad swaths of clinical questions, and many everyday clinical decisions still rely on low-quality evidence.</p>

*If you are working on solutions to this problem, or would like to discuss this further, [please get in touch](/me/#contact).*

Rick Mathews, PhD, is an MD/PhD candidate at the Oregon Health & Science University (OHSU), currently on leave.
