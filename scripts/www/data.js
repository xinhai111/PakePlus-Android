/* 小雅雅思 · 内置内容数据
 * 词库 4 组 × 12 词；写作 Task 2 题库 6 题；口语 Part 2 题卡 8 张
 */
window.XY = window.XY || {};

XY.WORD_SETS = [
  {
    id: "education",
    name: "教育",
    icon: "E",
    color: "var(--color-accent-2)",
    words: [
      { w: "curriculum", zh: "课程设置", pos: "n.", phon: "/kəˈrɪkjʊləm/", ex: "The school expanded its curriculum to include coding.", cn: "学校把编程加入了课程设置。", usage: "搭配: core / national / hidden curriculum" },
      { w: "scholarship", zh: "奖学金", pos: "n.", phon: "/ˈskɒləʃɪp/", ex: "She won a full scholarship to study abroad.", cn: "她赢得了全额奖学金出国留学。", usage: "搭配: full / merit-based scholarship" },
      { w: "foster", zh: "培养，促进", pos: "v.", phon: "/ˈfɒstə/", ex: "Small classes foster better teacher attention.", cn: "小班教学有助于老师更好地关注学生。", usage: "搭配: foster creativity / critical thinking" },
      { w: "rigorous", zh: "严格的，严谨的", pos: "adj.", phon: "/ˈrɪɡərəs/", ex: "A rigorous syllabus leaves no room for guesswork.", cn: "严谨的教学大纲不允许任何侥幸。", usage: "搭配: rigorous training / standards" },
      { w: "tuition", zh: "学费", pos: "n.", phon: "/tjuˈɪʃn/", ex: "Rising tuition has made higher education less accessible.", cn: "学费上涨让高等教育更难负担。", usage: "搭配: tuition fees / free tuition" },
      { w: "enrol", zh: "注册，入学", pos: "v.", phon: "/ɪnˈrəʊl/", ex: "More mature students are enrolling in evening courses.", cn: "越来越多成年人报名夜校课程。", usage: "拼写: enrol（英） / enroll（美）" },
      { w: "literacy", zh: "读写能力", pos: "n.", phon: "/ˈlɪtərəsi/", ex: "Digital literacy is now a basic requirement at work.", cn: "数字素养如今是工作的基本要求。", usage: "搭配: financial / media / digital literacy" },
      { w: "compulsory", zh: "义务的，强制的", pos: "adj.", phon: "/kəmˈpʌlsəri/", ex: "Schooling is compulsory until the age of sixteen.", cn: "十六岁之前必须接受义务教育。", usage: "搭配: compulsory education / attendance" },
      { w: "overlook", zh: "忽视", pos: "v.", phon: "/ˌəʊvəˈlʊk/", ex: "Standardised tests may overlook creativity.", cn: "标准化考试可能会忽视创造力。", usage: "注意: 勿与 look over 混淆" },
      { w: "discipline", zh: "纪律，学科", pos: "n.", phon: "/ˈdɪsəplɪn/", ex: "Learning an instrument teaches patience and discipline.", cn: "学乐器教会人耐心与自律。", usage: "一词两义: 纪律 / 学科" },
      { w: "outcome", zh: "结果，成果", pos: "n.", phon: "/ˈaʊtkʌm/", ex: "Exam scores are only one outcome of learning.", cn: "考试分数只是学习的一个结果。", usage: "搭配: learning / educational outcome" },
      { w: "peer", zh: "同龄人，同侪", pos: "n.", phon: "/pɪə/", ex: "Peer pressure strongly influences teenagers.", cn: "同侪压力对青少年影响很大。", usage: "搭配: peer pressure / peer review" }
    ]
  },
  {
    id: "environment",
    name: "环境",
    icon: "V",
    color: "var(--color-mint)",
    words: [
      { w: "sustainable", zh: "可持续的", pos: "adj.", phon: "/səˈsteɪnəbl/", ex: "Sustainable transport reduces urban air pollution.", cn: "可持续交通能减少城市空气污染。", usage: "搭配: sustainable development / energy" },
      { w: "mitigate", zh: "缓解，减轻", pos: "v.", phon: "/ˈmɪtɪɡeɪt/", ex: "Planting trees mitigates the effects of climate change.", cn: "植树可以缓解气候变化的影响。", usage: "搭配: mitigate the impact / risk" },
      { w: "emission", zh: "排放", pos: "n.", phon: "/ɪˈmɪʃn/", ex: "Carbon emissions have fallen across the city.", cn: "该市碳排放已经下降。", usage: "搭配: carbon / greenhouse gas emissions" },
      { w: "conserve", zh: "保护，节约", pos: "v.", phon: "/kənˈsɜːv/", ex: "We must conserve water for future generations.", cn: "我们必须为后代节约用水。", usage: "搭配: conserve energy / wildlife" },
      { w: "degrade", zh: "恶化，降解", pos: "v.", phon: "/dɪˈɡreɪd/", ex: "Overfarming degrades the quality of the soil.", cn: "过度耕种会使土壤退化。", usage: "名词: degradation" },
      { w: "disposable", zh: "一次性的", pos: "adj.", phon: "/dɪˈspəʊzəbl/", ex: "Many cities have banned disposable plastic bags.", cn: "许多城市已经禁止一次性塑料袋。", usage: "搭配: disposable cups / chopsticks" },
      { w: "renewable", zh: "可再生的", pos: "adj.", phon: "/rɪˈnjuːəbl/", ex: "Renewable sources now supply a third of our power.", cn: "可再生能源如今提供了三分之一的电力。", usage: "搭配: renewable energy / resources" },
      { w: "habitat", zh: "栖息地", pos: "n.", phon: "/ˈhæbɪtæt/", ex: "Urban expansion is destroying natural habitats.", cn: "城市扩张正在摧毁自然栖息地。", usage: "搭配: natural / wildlife habitat" },
      { w: "contaminate", zh: "污染，弄脏", pos: "v.", phon: "/kənˈtæmɪneɪt/", ex: "Industrial waste contaminates local rivers.", cn: "工业废料污染了当地河流。", usage: "比 pollute 更正式" },
      { w: "deteriorate", zh: "恶化", pos: "v.", phon: "/dɪˈtɪəriəreɪt/", ex: "Air quality deteriorates during the winter.", cn: "冬季空气质量会变差。", usage: "同义: worsen (口语)" },
      { w: "alternative", zh: "替代的", pos: "adj.", phon: "/ɔːlˈtɜːnətɪv/", ex: "Cycling is a clean alternative to driving.", cn: "骑行是开车的清洁替代方案。", usage: "搭配: alternative energy / solution" },
      { w: "prioritise", zh: "优先考虑", pos: "v.", phon: "/praɪˈɒrətaɪz/", ex: "Governments should prioritise public transport.", cn: "政府应当优先发展公共交通。", usage: "拼写: -ise（英） / -ize（美）" }
    ]
  },
  {
    id: "technology",
    name: "科技",
    icon: "T",
    color: "var(--color-accent-3)",
    words: [
      { w: "automate", zh: "使自动化", pos: "v.", phon: "/ˈɔːtəmeɪt/", ex: "Repetitive tasks are now automated by software.", cn: "重复性工作如今由软件自动化完成。", usage: "名词: automation" },
      { w: "disrupt", zh: "颠覆，扰乱", pos: "v.", phon: "/dɪsˈrʌpt/", ex: "Streaming services disrupted the music industry.", cn: "流媒体服务颠覆了音乐产业。", usage: "搭配: disrupt the market / industry" },
      { w: "prevalent", zh: "普遍的", pos: "adj.", phon: "/ˈprevələnt/", ex: "Remote work has become prevalent since 2020.", cn: "远程办公自 2020 年以来已很普遍。", usage: "名词: prevalence" },
      { w: "surveillance", zh: "监控", pos: "n.", phon: "/sɜːˈveɪləns/", ex: "Mass surveillance raises serious privacy concerns.", cn: "大规模监控引发了严重的隐私担忧。", usage: "搭配: surveillance cameras / system" },
      { w: "obsolete", zh: "过时的", pos: "adj.", phon: "/ˈɒbsəliːt/", ex: "Paper maps became obsolete with smartphones.", cn: "智能手机让纸质地图过时了。", usage: "搭配: become / render obsolete" },
      { w: "efficient", zh: "高效的", pos: "adj.", phon: "/ɪˈfɪʃnt/", ex: "Digital records are more efficient than paper files.", cn: "电子记录比纸质档案更高效。", usage: "反义: inefficient" },
      { w: "privacy", zh: "隐私", pos: "n.", phon: "/ˈprɪvəsi/", ex: "Children deserve privacy online too.", cn: "孩子在网络上也应享有隐私。", usage: "搭配: invade privacy / data privacy" },
      { w: "rely", zh: "依赖", pos: "v.", phon: "/rɪˈlaɪ/", ex: "Many students rely on translation apps.", cn: "许多学生依赖翻译软件。", usage: "搭配: rely on / upon" },
      { w: "advance", zh: "进步，进展", pos: "n.", phon: "/ədˈvɑːns/", ex: "Advances in AI are reshaping the job market.", cn: "人工智能的进步正在重塑就业市场。", usage: "搭配: technological / medical advance" },
      { w: "integrate", zh: "整合，融入", pos: "v.", phon: "/ˈɪntɪɡreɪt/", ex: "Schools integrate tablets into daily lessons.", cn: "学校把平板电脑融入日常课堂。", usage: "搭配: integrate A into B" },
      { w: "potential", zh: "潜力", pos: "n.", phon: "/pəˈtenʃl/", ex: "Technology has the potential to close the gap.", cn: "科技有潜力缩小差距。", usage: "搭配: realise / fulfil one's potential" },
      { w: "crucial", zh: "关键的", pos: "adj.", phon: "/ˈkruːʃl/", ex: "Data security is crucial for online banking.", cn: "数据安全对网银至关重要。", usage: "同义: vital / essential" }
    ]
  },
  {
    id: "work",
    name: "工作",
    icon: "W",
    color: "var(--color-lavender)",
    words: [
      { w: "occupation", zh: "职业", pos: "n.", phon: "/ˌɒkjuˈpeɪʃn/", ex: "The census records each person's occupation.", cn: "人口普查记录每个人的职业。", usage: "比 job 更正式" },
      { w: "candidate", zh: "候选人", pos: "n.", phon: "/ˈkændɪdət/", ex: "The best candidate often wins on soft skills.", cn: "最优秀的候选人往往赢在软技能。", usage: "搭配: a strong / suitable candidate" },
      { w: "negotiate", zh: "谈判，协商", pos: "v.", phon: "/nɪˈɡəʊʃieɪt/", ex: "Workers negotiate salaries and working hours.", cn: "员工协商薪酬与工时。", usage: "名词: negotiation" },
      { w: "flexible", zh: "灵活的", pos: "adj.", phon: "/ˈfleksəbl/", ex: "Flexible hours improve work-life balance.", cn: "弹性工时能改善工作与生活的平衡。", usage: "搭配: flexible working / schedule" },
      { w: "promotion", zh: "晋升", pos: "n.", phon: "/prəˈməʊʃn/", ex: "Clear promotion paths keep staff motivated.", cn: "清晰的晋升通道让员工保持动力。", usage: "搭配: get / earn a promotion" },
      { w: "deadline", zh: "截止日期", pos: "n.", phon: "/ˈdedlaɪn/", ex: "Tight deadlines often cause workplace stress.", cn: "紧迫的截止日期常常造成工作压力。", usage: "搭配: meet / miss a deadline" },
      { w: "permanent", zh: "长期的，固定的", pos: "adj.", phon: "/ˈpɜːmənənt/", ex: "She moved from a temporary post to a permanent one.", cn: "她从临时岗位转成了长期岗位。", usage: "反义: temporary" },
      { w: "rewarding", zh: "有回报的", pos: "adj.", phon: "/rɪˈwɔːdɪŋ/", ex: "Teaching is demanding but deeply rewarding.", cn: "教学辛苦但回报深远。", usage: "搭配: a rewarding career / job" },
      { w: "resign", zh: "辞职", pos: "v.", phon: "/rɪˈzaɪn/", ex: "She resigned to start her own business.", cn: "她辞职去创业了。", usage: "搭配: resign from a post" },
      { w: "overwhelm", zh: "压垮", pos: "v.", phon: "/ˌəʊvəˈwelm/", ex: "New employees are often overwhelmed at first.", cn: "新员工一开始往往不堪重负。", usage: "搭配: be overwhelmed with work" },
      { w: "ambitious", zh: "有雄心的", pos: "adj.", phon: "/æmˈbɪʃəs/", ex: "Ambitious staff may leave for better offers.", cn: "有雄心的人可能会跳槽去更好的机会。", usage: "名词: ambition" },
      { w: "vacancy", zh: "职位空缺", pos: "n.", phon: "/ˈveɪkənsi/", ex: "The company posted several vacancies online.", cn: "公司在网上发布了几个职位空缺。", usage: "搭配: fill a vacancy" }
    ]
  },
  {
    id: "health",
    name: "健康",
    icon: "H",
    color: "var(--color-accent-3)",
    words: [
      { w: "sedentary", zh: "久坐的", pos: "adj.", phon: "/ˈsedntri/", ex: "A desk job is a sedentary way of life.", cn: "坐办公室是一种久坐的生活方式。", usage: "搭配: sedentary lifestyle / work" },
      { w: "diagnosis", zh: "诊断", pos: "n.", phon: "/ˌdaɪəɡˈnəʊsɪs/", ex: "Early diagnosis improves the chance of recovery.", cn: "早期诊断能提高康复的几率。", usage: "搭配: make / confirm a diagnosis" },
      { w: "chronic", zh: "慢性的", pos: "adj.", phon: "/ˈkrɒnɪk/", ex: "Chronic stress affects both sleep and appetite.", cn: "慢性压力既影响睡眠也影响食欲。", usage: "反义: acute（急性的）" },
      { w: "epidemic", zh: "流行病", pos: "n.", phon: "/ˌepɪˈdemɪk/", ex: "The city responded quickly to the epidemic.", cn: "这座城市对流行病反应迅速。", usage: "搭配: an epidemic of" },
      { w: "nutritious", zh: "有营养的", pos: "adj.", phon: "/njuˈtrɪʃəs/", ex: "School meals should be affordable and nutritious.", cn: "校餐应当既负担得起又有营养。", usage: "名词: nutrition" },
      { w: "vaccine", zh: "疫苗", pos: "n.", phon: "/ˈvæksiːn/", ex: "Vaccines protect children from serious diseases.", cn: "疫苗保护儿童免受严重疾病侵害。", usage: "搭配: develop / receive a vaccine" },
      { w: "obesity", zh: "肥胖", pos: "n.", phon: "/əʊˈbiːsəti/", ex: "Obesity among children is rising in many countries.", cn: "许多国家的儿童肥胖率在上升。", usage: "搭配: childhood obesity" },
      { w: "preventive", zh: "预防性的", pos: "adj.", phon: "/prɪˈventɪv/", ex: "Preventive care is cheaper than treatment.", cn: "预防保健比治疗更便宜。", usage: "另见: preventative（同义）" },
      { w: "therapy", zh: "治疗，疗法", pos: "n.", phon: "/ˈθerəpi/", ex: "Art therapy helps patients express emotions.", cn: "艺术治疗帮助病人表达情绪。", usage: "搭配: physical / speech therapy" },
      { w: "hygiene", zh: "卫生", pos: "n.", phon: "/ˈhaɪdʒiːn/", ex: "Good hand hygiene prevents the spread of germs.", cn: "良好的手部卫生能防止病菌传播。", usage: "搭配: personal / food hygiene" },
      { w: "wellbeing", zh: "身心健康", pos: "n.", phon: "/ˌwelˈbiːɪŋ/", ex: "Flexible hours improve workers' mental wellbeing.", cn: "弹性工时能改善员工的心理健康。", usage: "拼写: wellbeing 或 well-being" },
      { w: "lifespan", zh: "寿命", pos: "n.", phon: "/ˈlaɪfspæn/", ex: "Better medicine has extended the human lifespan.", cn: "更好的医疗延长了人类寿命。", usage: "搭配: average lifespan" }
    ]
  },
  {
    id: "society",
    name: "社会与犯罪",
    icon: "S",
    color: "var(--color-mint)",
    words: [
      { w: "deterrent", zh: "威慑", pos: "n.", phon: "/dɪˈterənt/", ex: "Heavy fines act as a deterrent to speeding.", cn: "重罚对超速有威慑作用。", usage: "搭配: act as a deterrent" },
      { w: "offender", zh: "违法者", pos: "n.", phon: "/əˈfendə/", ex: "Young offenders are often given community service.", cn: "年轻违法者常被处以社区服务。", usage: "搭配: first-time / repeat offender" },
      { w: "rehabilitation", zh: "改造，康复", pos: "n.", phon: "/ˌriːəˌbɪlɪˈteɪʃn/", ex: "Prisons should focus on rehabilitation, not punishment alone.", cn: "监狱应重在改造，而不是单纯惩罚。", usage: "动词: rehabilitate" },
      { w: "recidivism", zh: "再次犯罪", pos: "n.", phon: "/rɪˈsɪdɪvɪzəm/", ex: "Education programmes reduce recidivism rates.", cn: "教育项目能降低再次犯罪率。", usage: "学术词，用于讨论刑政" },
      { w: "verdict", zh: "裁决", pos: "n.", phon: "/ˈvɜːdɪkt/", ex: "The jury reached a unanimous verdict.", cn: "陪审团作出了一致裁决。", usage: "搭配: reach / deliver a verdict" },
      { w: "legislation", zh: "立法", pos: "n.", phon: "/ˌledʒɪsˈleɪʃn/", ex: "New legislation bans single-use plastics.", cn: "新立法禁止一次性塑料。", usage: "搭配: pass / introduce legislation" },
      { w: "corruption", zh: "腐败", pos: "n.", phon: "/kəˈrʌpʃn/", ex: "Corruption undermines public trust in government.", cn: "腐败侵蚀公众对政府的信任。", usage: "搭配: fight / tackle corruption" },
      { w: "witness", zh: "证人", pos: "n.", phon: "/ˈwɪtnəs/", ex: "The witness described what happened at the scene.", cn: "证人描述了现场发生的事。", usage: "搭配: key witness" },
      { w: "fraud", zh: "欺诈", pos: "n.", phon: "/frɔːd/", ex: "Online fraud is a growing concern for banks.", cn: "网络欺诈是银行日益担忧的问题。", usage: "搭配: identity / credit-card fraud" },
      { w: "justice", zh: "正义，司法", pos: "n.", phon: "/ˈdʒʌstɪs/", ex: "Victims expect the justice system to protect them.", cn: "受害者期待司法系统保护他们。", usage: "搭配: criminal justice system" },
      { w: "penalty", zh: "处罚", pos: "n.", phon: "/ˈpenəlti/", ex: "The penalty for drunk driving is a heavy fine.", cn: "酒驾的处罚是重罚。", usage: "搭配: a penalty for" },
      { w: "juvenile", zh: "青少年的", pos: "adj.", phon: "/ˈdʒuːvənaɪl/", ex: "The court deals with juvenile offenders separately.", cn: "法庭单独处理青少年违法者。", usage: "搭配: juvenile crime / delinquency" }
    ]
  },
  {
    id: "urban",
    name: "城市与交通",
    icon: "U",
    color: "var(--color-accent-2)",
    words: [
      { w: "congestion", zh: "拥堵", pos: "n.", phon: "/kənˈdʒestʃən/", ex: "Traffic congestion costs cities billions every year.", cn: "交通拥堵每年让城市损失数十亿。", usage: "搭配: traffic congestion" },
      { w: "infrastructure", zh: "基础设施", pos: "n.", phon: "/ˈɪnfrəstrʌktʃə/", ex: "Modern cities need better public infrastructure.", cn: "现代城市需要更好的公共基础设施。", usage: "搭配: transport / digital infrastructure" },
      { w: "commuter", zh: "通勤者", pos: "n.", phon: "/kəˈmjuːtə/", ex: "Many commuters take trains to avoid traffic.", cn: "许多通勤者乘火车躲避拥堵。", usage: "动词: commute" },
      { w: "amenity", zh: "便利设施", pos: "n.", phon: "/əˈmiːnəti/", ex: "Parks and libraries are essential urban amenities.", cn: "公园和图书馆是重要的城市设施。", usage: "搭配: local / public amenities" },
      { w: "sprawl", zh: "无序扩张", pos: "n.", phon: "/sprɔːl/", ex: "Urban sprawl swallows the farmland around cities.", cn: "城市无序扩张吞噬城郊农田。", usage: "搭配: urban sprawl" },
      { w: "pedestrian", zh: "行人", pos: "n.", phon: "/pəˈdestriən/", ex: "Pedestrian zones make shopping streets safer.", cn: "步行区让商业街更安全。", usage: "搭配: pedestrian crossing / zone" },
      { w: "dense", zh: "密集的", pos: "adj.", phon: "/dens/", ex: "Dense housing is more efficient than scattered suburbs.", cn: "密集住宅比分散的郊区更高效。", usage: "搭配: densely populated" },
      { w: "renovate", zh: "翻新", pos: "v.", phon: "/ˈrenəveɪt/", ex: "The council renovated the old market hall.", cn: "市政翻新了旧市场大厅。", usage: "名词: renovation" },
      { w: "suburb", zh: "郊区", pos: "n.", phon: "/ˈsʌbɜːb/", ex: "Families often move to suburbs for better schools.", cn: "家庭常为了更好的学校搬到郊区。", usage: "形容词: suburban" },
      { w: "commute", zh: "通勤", pos: "v.", phon: "/kəˈmjuːt/", ex: "She commutes an hour each way by bike.", cn: "她每天骑车通勤一小时。", usage: "搭配: commute to work" },
      { w: "municipal", zh: "市政的", pos: "adj.", phon: "/mjuːˈnɪsɪpl/", ex: "Municipal buses run every ten minutes.", cn: "市政公交每十分钟一班。", usage: "搭配: municipal government" },
      { w: "affordable", zh: "负担得起的", pos: "adj.", phon: "/əˈfɔːdəbl/", ex: "Affordable housing is a major election issue.", cn: "可负担住房是重大选举议题。", usage: "搭配: affordable housing" }
    ]
  },
  {
    id: "academic",
    name: "学术核心",
    icon: "A",
    color: "var(--color-lavender)",
    words: [
      { w: "significant", zh: "显著的", pos: "adj.", phon: "/sɪɡˈnɪfɪkənt/", ex: "The results show a significant improvement.", cn: "结果显示显著进步。", usage: "名词: significance" },
      { w: "approach", zh: "方法", pos: "n.", phon: "/əˈprəʊtʃ/", ex: "A balanced approach to diet works best.", cn: "均衡的饮食方法最有效。", usage: "搭配: adopt an approach" },
      { w: "assess", zh: "评估", pos: "v.", phon: "/əˈses/", ex: "Teachers assess students through continuous work.", cn: "老师通过持续作业评估学生。", usage: "名词: assessment" },
      { w: "concept", zh: "概念", pos: "n.", phon: "/ˈkɒnsept/", ex: "The concept of fairness is hard to define.", cn: "公平的概念很难定义。", usage: "搭配: grasp a concept" },
      { w: "context", zh: "语境，背景", pos: "n.", phon: "/ˈkɒntekst/", ex: "Words change meaning depending on context.", cn: "词义随语境而变。", usage: "搭配: in the context of" },
      { w: "establish", zh: "建立", pos: "v.", phon: "/ɪˈstæblɪʃ/", ex: "The study established a link between sleep and memory.", cn: "研究建立了睡眠与记忆之间的联系。", usage: "搭配: establish a link" },
      { w: "occur", zh: "发生", pos: "v.", phon: "/əˈkɜː/", ex: "Accidents often occur during rush hour.", cn: "事故常发生在高峰时段。", usage: "名词: occurrence" },
      { w: "indicate", zh: "表明", pos: "v.", phon: "/ˈɪndɪkeɪt/", ex: "The data indicates a steady rise in prices.", cn: "数据显示价格稳步上涨。", usage: "名词: indication" },
      { w: "principle", zh: "原则", pos: "n.", phon: "/ˈprɪnsəpl/", ex: "The school runs on the principle of respect.", cn: "学校以尊重为办学原则。", usage: "搭配: guiding principle" },
      { w: "derive", zh: "获得，源自", pos: "v.", phon: "/dɪˈraɪv/", ex: "Many English words derive from Latin.", cn: "许多英语单词源自拉丁语。", usage: "搭配: derive from" },
      { w: "ensure", zh: "确保", pos: "v.", phon: "/ɪnˈʃʊə/", ex: "Regular review ensures you remember vocabulary.", cn: "定期复习能确保你记住词汇。", usage: "搭配: ensure that" },
      { w: "accumulate", zh: "积累", pos: "v.", phon: "/əˈkjuːmjəleɪt/", ex: "You accumulate knowledge through daily practice.", cn: "你通过每日练习积累知识。", usage: "名词: accumulation" }
    ]
  },
  {
    id: "media",
    name: "媒体",
    icon: "M",
    color: "var(--color-accent)",
    words: [
      { w: "bias", zh: "偏见", pos: "n.", phon: "/ˈbaɪəs/", ex: "News outlets should avoid political bias.", cn: "新闻机构应避免政治偏见。", usage: "搭配: media bias" },
      { w: "censorship", zh: "审查", pos: "n.", phon: "/ˈsensəʃɪp/", ex: "Press censorship limits freedom of speech.", cn: "新闻审查限制言论自由。", usage: "动词: censor" },
      { w: "propaganda", zh: "宣传", pos: "n.", phon: "/ˌprɒpəˈɡændə/", ex: "Propaganda repeats simple messages until they seem true.", cn: "宣传把简单的信息重复到看似真实。", usage: "多含贬义" },
      { w: "credible", zh: "可信的", pos: "adj.", phon: "/ˈkredəbl/", ex: "Always check whether the source is credible.", cn: "始终核查来源是否可信。", usage: "搭配: credible source" },
      { w: "mainstream", zh: "主流的", pos: "adj.", phon: "/ˈmeɪnstriːm/", ex: "The story was ignored by mainstream media.", cn: "这个故事被主流媒体忽略了。", usage: "搭配: mainstream media" },
      { w: "broadcast", zh: "广播，播出", pos: "n.", phon: "/ˈbrɔːdkɑːst/", ex: "The interview aired on a live broadcast.", cn: "采访在直播中播出。", usage: "搭配: live broadcast" },
      { w: "tabloid", zh: "小报", pos: "n.", phon: "/ˈtæblɔɪd/", ex: "Tabloids focus on celebrity gossip.", cn: "小报关注名人八卦。", usage: "搭配: tabloid newspaper" },
      { w: "columnist", zh: "专栏作家", pos: "n.", phon: "/ˈkɒləmnɪst/", ex: "She is a columnist for a national paper.", cn: "她是全国性报纸的专栏作家。", usage: "搭配: a columnist for" },
      { w: "circulation", zh: "发行量", pos: "n.", phon: "/ˌsɜːkjəˈleɪʃn/", ex: "The paper's circulation has fallen sharply.", cn: "该报的发行量急剧下降。", usage: "搭配: daily circulation" },
      { w: "disinformation", zh: "虚假信息", pos: "n.", phon: "/ˌdɪsɪnfəˈmeɪʃn/", ex: "Disinformation spreads faster than truth online.", cn: "网上虚假信息比真相传播更快。", usage: "对比: misinformation（无意错误）" },
      { w: "influencer", zh: "网络红人", pos: "n.", phon: "/ˈɪnfluənsə/", ex: "Brands pay influencers to promote products.", cn: "品牌付费请网红推广产品。", usage: "搭配: social media influencer" },
      { w: "objective", zh: "客观的", pos: "adj.", phon: "/əbˈdʒektɪv/", ex: "Journalists should remain objective and fair.", cn: "记者应保持客观公正。", usage: "反义: subjective" }
    ]
  },
  {
    id: "travel",
    name: "旅行",
    icon: "T",
    color: "var(--color-accent-3)",
    words: [
      { w: "itinerary", zh: "行程安排", pos: "n.", phon: "/aɪˈtɪnərəri/", ex: "The tour company provided a detailed itinerary.", cn: "旅行社提供了详细的行程安排。", usage: "搭配: travel itinerary" },
      { w: "accommodation", zh: "住宿", pos: "n.", phon: "/əˌkɒməˈdeɪʃn/", ex: "Accommodation takes up most of the travel budget.", cn: "住宿占去旅行预算的大部分。", usage: "搭配: book accommodation" },
      { w: "destination", zh: "目的地", pos: "n.", phon: "/ˌdestɪˈneɪʃn/", ex: "Popular destinations get crowded in summer.", cn: "热门目的地夏天会很拥挤。", usage: "搭配: holiday destination" },
      { w: "excursion", zh: "短途旅行", pos: "n.", phon: "/ɪkˈskɜːʃn/", ex: "The hotel offers excursions to nearby islands.", cn: "酒店提供去附近岛屿的短途游。", usage: "搭配: a day excursion" },
      { w: "souvenir", zh: "纪念品", pos: "n.", phon: "/ˌsuːvəˈnɪə/", ex: "I bought a fridge magnet as a souvenir.", cn: "我买了个冰箱贴当纪念品。", usage: "搭配: souvenir shop" },
      { w: "reservation", zh: "预订", pos: "n.", phon: "/ˌrezəˈveɪʃn/", ex: "We made a reservation for eight o'clock.", cn: "我们预订了八点的位子。", usage: "搭配: make a reservation" },
      { w: "visa", zh: "签证", pos: "n.", phon: "/ˈviːzə/", ex: "You need a visa to enter the country.", cn: "进入该国需要签证。", usage: "搭配: apply for a visa" },
      { w: "scenic", zh: "风景优美的", pos: "adj.", phon: "/ˈsiːnɪk/", ex: "We took the scenic route along the coast.", cn: "我们走了沿海的风景路线。", usage: "搭配: scenic view / spot" },
      { w: "landmark", zh: "地标", pos: "n.", phon: "/ˈlændmɑːk/", ex: "The tower is the city's most famous landmark.", cn: "这座塔是该城最著名的地标。", usage: "搭配: famous landmark" },
      { w: "brochure", zh: "宣传册", pos: "n.", phon: "/ˈbrəʊʃə/", ex: "The brochure described every hotel in detail.", cn: "宣传册详细介绍了每家酒店。", usage: "搭配: travel brochure" },
      { w: "jet lag", zh: "时差反应", pos: "n.", phon: "/ˈdʒet læɡ/", ex: "Jet lag made the first day a blur.", cn: "时差让第一天昏昏沉沉。", usage: "搭配: suffer from jet lag" },
      { w: "luggage", zh: "行李", pos: "n.", phon: "/ˈlʌɡɪdʒ/", ex: "Keep your luggage within the weight limit.", cn: "行李不要超重。", usage: "不可数名词" }
    ]
  }
];

XY.WRITING_PROMPTS = [
  {
    id: "w1",
    task: "观点题",
    title: "远程办公会取代办公室吗？",
    prompt: "Some people believe that working from home will completely replace the traditional office within the next decade. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience."
  },
  {
    id: "w2",
    task: "讨论题",
    title: "大学是否应免费？",
    prompt: "Some people think that university education should be free for everyone, while others believe it is the responsibility of individuals to pay for their own tuition. Discuss both views and give your own opinion."
  },
  {
    id: "w3",
    task: "利弊题",
    title: "社交媒体与青少年",
    prompt: "More and more teenagers spend a large amount of time on social media. What are the advantages and disadvantages of this trend?"
  },
  {
    id: "w4",
    task: "问题解决题",
    title: "城市交通拥堵",
    prompt: "Traffic congestion is a growing problem in many cities around the world. What are the causes of this problem, and what measures could be taken to solve it?"
  },
  {
    id: "w5",
    task: "观点题",
    title: "环保应靠个人还是政府？",
    prompt: "Some people argue that individuals should take responsibility for protecting the environment, while others believe that governments and large companies are the ones who should act. To what extent do you agree with each view?"
  },
  {
    id: "w6",
    task: "讨论题",
    title: "AI 会减少工作岗位吗？",
    prompt: "Artificial intelligence is increasingly able to perform jobs that were once done by humans. Some people fear mass unemployment, while others see new opportunities. Discuss both views and give your own opinion."
  }
];

XY.SPEAKING_CARDS = [
  {
    id: "s1",
    title: "描述一位你非常佩服的人",
    points: "这个人是谁 · 你怎么认识他/她 · 你佩服他/她的什么 · 为什么他/她值得被佩服",
    questions: ["你觉得什么样的人容易被佩服？", "领导力和同理心，哪个对优秀的人更重要？"]
  },
  {
    id: "s2",
    title: "描述一个你去过且印象深刻的城市",
    points: "城市在哪里 · 你什么时候去的 · 那里有什么特别之处 · 为什么印象深刻",
    questions: ["人们为什么更喜欢住在热闹的大城市？", "旅游业对城市居民的影响是正面还是负面？"]
  },
  {
    id: "s3",
    title: "描述一件你每天都会使用的物品",
    points: "它是什么 · 你从什么时候开始用 · 你用它做什么 · 为什么它对你很重要",
    questions: ["科技产品让生活变复杂还是变简单了？", "人们是否过度依赖电子产品？"]
  },
  {
    id: "s4",
    title: "描述一次你帮助别人的经历",
    points: "发生在什么时候 · 你帮了什么 · 结果如何 · 你从中学到了什么",
    questions: ["帮助陌生人和帮助朋友有什么不同？", "志愿者活动应该成为学校的必修课吗？"]
  },
  {
    id: "s5",
    title: "描述一个你常去的地方",
    points: "在哪里 · 你多久去一次 · 你在那里做什么 · 为什么你喜欢去那里",
    questions: ["为什么越来越多人喜欢宅在家里？", "公共休闲空间对社区重要吗？"]
  },
  {
    id: "s6",
    title: "描述一个你想参加的运动",
    points: "什么运动 · 你为什么想参加 · 需要什么准备 · 你期待从中得到什么",
    questions: ["团队运动和个人运动哪个更好？", "为什么很多成年人不再运动？"]
  },
  {
    id: "s7",
    title: "描述一次你克服困难的经历",
    points: "困难是什么 · 你怎么面对的 · 用了多久解决 · 这次经历带来什么影响",
    questions: ["年轻人面对困难时最需要什么支持？", "失败的经历对成长有益吗？"]
  },
  {
    id: "s8",
    title: "描述一本对你有影响的书",
    points: "书名与作者 · 你什么时候读的 · 内容是什么 · 它如何影响了你的想法",
    questions: ["纸质书会被电子书完全取代吗？", "阅读对现代人的生活还重要吗？"]
  }
];

XY.WRITING_TASK1 = [
  {
    id: "t1",
    type: "折线图",
    title: "三城国际游客数（1995-2025）",
    prompt: "The line graph shows the number of international visitors to three cities between 1995 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: '<svg viewBox="0 0 300 150" width="100%" height="auto" role="img" aria-label="折线图：三城国际游客数" style="display:block;"><g fill="none" stroke-width="1.5" stroke="oklch(82% 0.03 95)"><path d="M22 118 L282 118"/><path d="M22 14 L22 118"/></g><g fill="none" stroke-width="2.4" stroke-linecap="round"><path d="M22 100 C70 96 110 92 150 84 S230 52 282 26" stroke="oklch(66% 0.18 235)"/><path d="M22 88 C80 70 130 74 180 58 S250 42 282 50" stroke="oklch(74% 0.16 150)"/><path d="M22 62 C90 84 150 88 205 66 S265 34 282 30" stroke="oklch(68% 0.24 18)"/></g><g fill="oklch(52% 0.025 250)" font-size="9" font-family="JetBrains Mono, ui-monospace, monospace"><text x="22" y="132">1995</text><text x="260" y="132">2025</text></g></svg>'
  },
  {
    id: "t2",
    type: "柱状图",
    title: "五国宽带入户率（2010 vs 2025）",
    prompt: "The bar chart shows the percentage of households with internet access in five countries in 2010 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: '<svg viewBox="0 0 300 150" width="100%" height="auto" role="img" aria-label="柱状图：五国宽带入户率" style="display:block;"><g fill="none" stroke-width="1.5" stroke="oklch(82% 0.03 95)"><path d="M22 118 L282 118"/><path d="M22 14 L22 118"/></g><g fill="oklch(52% 0.025 250)" font-size="8" font-family="JetBrains Mono, ui-monospace, monospace"><text x="18" y="124">0</text><text x="18" y="72">50%</text><text x="12" y="20">100%</text></g><g><rect x="38" y="84" width="20" height="34" rx="2" fill="oklch(66% 0.18 235)"/><rect x="62" y="46" width="20" height="72" rx="2" fill="oklch(74% 0.16 150)"/><rect x="88" y="96" width="20" height="22" rx="2" fill="oklch(66% 0.18 235)"/><rect x="112" y="60" width="20" height="58" rx="2" fill="oklch(74% 0.16 150)"/><rect x="138" y="74" width="20" height="44" rx="2" fill="oklch(66% 0.18 235)"/><rect x="162" y="38" width="20" height="80" rx="2" fill="oklch(74% 0.16 150)"/><rect x="188" y="92" width="20" height="26" rx="2" fill="oklch(66% 0.18 235)"/><rect x="212" y="30" width="20" height="88" rx="2" fill="oklch(74% 0.16 150)"/><rect x="238" y="104" width="20" height="14" rx="2" fill="oklch(66% 0.18 235)"/><rect x="262" y="52" width="20" height="66" rx="2" fill="oklch(74% 0.16 150)"/></g></svg>'
  },
  {
    id: "t3",
    type: "饼图",
    title: "某国能源结构（2005 vs 2025）",
    prompt: "The pie charts show the sources of energy in a country in 2005 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: '<svg viewBox="0 0 300 150" width="100%" height="auto" role="img" aria-label="饼图：能源结构对比" style="display:block;"><g fill="none" stroke-width="13"><circle cx="72" cy="64" r="30" stroke-dasharray="94 94.5" stroke-dashoffset="0" stroke="oklch(66% 0.18 235)"/><circle cx="72" cy="64" r="30" stroke-dasharray="66 122.5" stroke-dashoffset="94" stroke="oklch(80% 0.16 150)"/><circle cx="72" cy="64" r="30" stroke-dasharray="19 169.5" stroke-dashoffset="160" stroke="oklch(68% 0.24 18)"/><circle cx="72" cy="64" r="30" stroke-dasharray="9.4 179.1" stroke-dashoffset="179" stroke="oklch(74% 0.16 305)"/></g><g fill="none" stroke-width="13"><circle cx="228" cy="64" r="30" stroke-dasharray="56.5 132" stroke-dashoffset="0" stroke="oklch(66% 0.18 235)"/><circle cx="228" cy="64" r="30" stroke-dasharray="47 141.5" stroke-dashoffset="56.5" stroke="oklch(80% 0.16 150)"/><circle cx="228" cy="64" r="30" stroke-dasharray="28.3 160.2" stroke-dashoffset="103.5" stroke="oklch(68% 0.24 18)"/><circle cx="228" cy="64" r="30" stroke-dasharray="56.5 132" stroke-dashoffset="131.8" stroke="oklch(74% 0.16 305)"/></g><g fill="oklch(52% 0.025 250)" font-size="9" font-family="JetBrains Mono, ui-monospace, monospace"><text x="44" y="112">2005</text><text x="200" y="112">2025</text></g><g font-size="8.5" font-family="JetBrains Mono, ui-monospace, monospace" fill="oklch(52% 0.025 250)"><rect x="20" y="124" width="8" height="8" rx="2" fill="oklch(66% 0.18 235)"/><text x="33" y="131">煤</text><rect x="62" y="124" width="8" height="8" rx="2" fill="oklch(80% 0.16 150)"/><text x="75" y="131">气</text><rect x="104" y="124" width="8" height="8" rx="2" fill="oklch(68% 0.24 18)"/><text x="117" y="131">核</text><rect x="146" y="124" width="8" height="8" rx="2" fill="oklch(74% 0.16 305)"/><text x="159" y="131">再生</text></g></svg>'
  },
  {
    id: "t4",
    type: "流程图",
    title: "回收纸变新纸",
    prompt: "The diagram shows the process by which recycled paper is made into new paper products. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: '<svg viewBox="0 0 300 150" width="100%" height="auto" role="img" aria-label="流程图：回收纸制作" style="display:block;"><g stroke="oklch(76% 0.20 95)" stroke-width="1.2" fill="oklch(93% 0.05 95)"><rect x="14" y="16" width="128" height="34" rx="8"/><rect x="158" y="16" width="128" height="34" rx="8"/><rect x="14" y="96" width="128" height="34" rx="8"/><rect x="158" y="96" width="128" height="34" rx="8"/></g><g stroke="oklch(52% 0.025 250)" stroke-width="1.6" fill="none"><path d="M146 33 L154 33"/><path d="M150 29 L158 33 L150 37"/><path d="M222 54 L222 92"/><path d="M218 86 L222 94 L226 86"/><path d="M146 113 L154 113"/><path d="M150 109 L158 113 L150 117"/></g><g fill="oklch(52% 0.025 250)" font-size="9.5" font-family="JetBrains Mono, ui-monospace, monospace" text-anchor="middle"><text x="78" y="37">收集旧纸</text><text x="222" y="37">浸泡打浆</text><text x="78" y="117">压制干燥</text><text x="222" y="117">切成新纸</text></g></svg>'
  },
  {
    id: "t5",
    type: "地图",
    title: "小镇改造前后",
    prompt: "The maps show a small town in 2000 and at present, after the construction of a new road and a park. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    chart: '<svg viewBox="0 0 300 150" width="100%" height="auto" role="img" aria-label="地图：小镇改造前后" style="display:block;"><g stroke="oklch(76% 0.20 95)" stroke-width="1.2" fill="oklch(93% 0.05 95)"><rect x="14" y="16" width="128" height="118" rx="6"/><rect x="158" y="16" width="128" height="118" rx="6"/></g><g fill="oklch(66% 0.18 235)"><rect x="30" y="34" width="30" height="22" rx="3"/><rect x="74" y="34" width="30" height="22" rx="3"/><rect x="30" y="70" width="30" height="22" rx="3"/><rect x="74" y="70" width="30" height="22" rx="3"/></g><g fill="oklch(74% 0.16 150)"><rect x="174" y="34" width="30" height="22" rx="3"/><rect x="218" y="34" width="30" height="22" rx="3"/><rect x="174" y="70" width="30" height="22" rx="3"/></g><g stroke="oklch(80% 0.16 150)" stroke-width="5" stroke-linecap="round" fill="none"><path d="M196 108 C196 96 218 96 218 84"/></g><g fill="oklch(52% 0.025 250)" font-size="9" font-family="JetBrains Mono, ui-monospace, monospace" text-anchor="middle"><text x="78" y="128">2000 年</text><text x="222" y="128">现在</text></g></svg>'
  }
];

XY.SPEAKING_PART1 = [
  { id: "p1", q: "Do you work or are you a student?", tips: ["工作/专业", "日常内容", "喜不喜欢，一句话理由"] },
  { id: "p2", q: "Where do you usually study or work?", tips: ["地点描述", "为什么选这里", "环境对效率的影响"] },
  { id: "p3", q: "What do you usually do in the morning?", tips: ["时间顺序", "一个固定习惯", "忙碌与否"] },
  { id: "p4", q: "Do you prefer tea or coffee?", tips: ["直接回答", "频率", "社交场合"] },
  { id: "p5", q: "What kind of music do you like?", tips: ["类型+例子", "什么时候听", "现场 vs 耳机"] },
  { id: "p6", q: "Do you like reading books?", tips: ["电子书/纸质", "最近读的一本", "阅读时间"] },
  { id: "p7", q: "What do you do to relax?", tips: ["一个活动", "多久一次", "为什么有效"] },
  { id: "p8", q: "Do you enjoy travelling?", tips: ["最近一次旅行", "喜欢的原因", "下一次想去哪"] },
  { id: "p9", q: "What is your favourite season?", tips: ["季节+理由", "天气与活动", "对比一个不喜欢的"] },
  { id: "p10", q: "Do you like cooking?", tips: ["会做什么菜", "外卖 vs 自己做", "健康角度"] }
];
