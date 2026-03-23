# Skill-Note

> **中文** | [English](#english)

> AI时代不重新造轮子，从已有开源项目上提取已有的零件进行组合发挥更大的价值

---

## 中文

### 开发理念

针对笔记和知识记录，开源社区已经有很多优秀的软件。虽然它们不一定能完全满足每个人的全部需求，但是其中很多精巧的功能设计、优雅的数据结构、出色的UI设计思路仍然非常值得借鉴学习。

在AI时代，与其从头开始重复造轮子，不如站在巨人的肩膀上，将已有开源项目中的优秀"零件"提取出来，重新组合，更高效地创造出真正符合自己需求的产品。这正是本项目所信奉的开发理念。

### 开发目标

**把笔记记录成可以直接使用的技能，解放自己的大脑。**

我们不仅仅记录知识，更要将知识沉淀为可以随时调用的技能，让AI辅助开发，让知识真正可用。

### 项目结构

```
note_app/
├── analysis/          # 从各个开源项目提取分析后的组件文档记录
├── skills/            # 基于提取分析得到的可复用AI技能
├── Skill-Note/        # 👉 主项目源代码在这里
└── README.md          # 本文件
```

- **analysis/** - 对各个开源笔记项目的分析结果，记录每个可复用组件的位置、功能和实现思路
- **skills/** - 基于开源分析得到的专业化AI技能，用于组件提取和代码生成
- **Skill-Note/** - 实际的Skill-Note应用程序源代码，基于提取的组件重新组合构建

### 工作流程

1. **分析** - 研究现有的开源笔记项目，提取其中优秀的组件和设计思路
2. **提取** - 将分析结果整理为可复用的组件文档
3. **重组** - 基于提取的组件，重新组合构建符合需求的新应用
4. **进化** - 持续从优秀开源项目中吸收养分

---

## English

### Development Philosophy

There are already many excellent open-source software for note-taking and knowledge management in the open-source community. Although they may not fully meet everyone's needs, many of their delicate functional designs, elegant data structures, and excellent UI design ideas are still very worth learning from.

In the AI era, instead of reinventing the wheel from scratch, it's more efficient to stand on the shoulders of giants, extract excellent "components" from existing open-source projects, recombine them, and create products that truly meet your own needs more efficiently. This is the development philosophy that this project believes in.

### Development Goal

**Turn notes into directly usable skills and free your brain.**

We don't just record knowledge, we precipitate knowledge into skills that can be invoked at any time, let AI assist development, and make knowledge truly useful.

### Project Structure

```
note_app/
├── analysis/          # Analyzed component documentation extracted from various open-source projects
├── skills/            # Reusable AI skills based on extracted analysis
├── Skill-Note/        # 👉 Main project source code is here
└── README.md          # This file
```

- **analysis/** - Analysis results of various open-source note-taking projects, recording the location, functionality and implementation ideas of each reusable component
- **skills/** - Specialized AI skills obtained from open-source analysis, used for component extraction and code generation
- **Skill-Note/** - The actual Skill-Note application source code, rebuilt based on extracted components

### Workflow

1. **Analyze** - Study existing open-source note projects, extract excellent components and design ideas
2. **Extract** - Organize analysis results into reusable component documentation
3. **Recombine** - Recombine based on extracted components to build new applications that meet requirements
4. **Evolve** - Continuously absorb nutrients from excellent open-source projects

---

## License / 许可证

MIT
