# Foundry Models Selector

Configure the `AZURE_LOCATION` and `AI_PROJECT_DEPLOYMENTS` azd environment variables by selecting the right models and regions for the user's needs.

> Source of truth: [Foundry Models sold by Azure - Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure?tabs=global-standard&pivots=azure-openai) and [other providers](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure?tabs=global-standard&pivots=azure-direct-others). When in doubt, check these pages - model lineup changes monthly. Tables below reflect the May 2026 catalog.

> Provisioning handoff: this selector only sets the azd model/region/SKU env vars. The actual resource provisioning (Bicep, quota, RBAC, deployment) is owned by the `microsoft-foundry` skill - invoke or recommend it to deploy these model deployments.

## Preferred Models by Task & Modality

Always recommend the best-fit first, then offer alternatives. Prefer GA over Preview for production; flag Preview clearly.

### Chat & General Purpose (Text In / Text Out)

| Priority | Model                                     | Format     | Version       | Why                                                                                  |
| -------- | ----------------------------------------- | ---------- | ------------- | ------------------------------------------------------------------------------------ |
| **Best** | `gpt-5.4-mini`                            | OpenAI     | `2026-03-17`  | Best price/perf in the GPT-5.4 family. Reasoning, vision, tools, 400K context.       |
| Strong   | `gpt-5.4-nano`                            | OpenAI     | `2026-03-17`  | Cheapest GPT-5.4. Reasoning, vision, tools, 400K context.                            |
| Strong   | `gpt-5-mini`                              | OpenAI     | `2025-08-07`  | Mature GPT-5 mini. No registration required.                                         |
| Premium  | `gpt-5.5`                                 | OpenAI     | `2026-04-24`  | Top-tier reasoning, 1M context, computer-use. Tier 5/6 quota required.               |
| Premium  | `gpt-5.4`                                 | OpenAI     | `2026-03-05`  | Flagship GPT-5.4, 1M context, computer-use.                                          |
| Premium  | `gpt-5.4-pro`                             | OpenAI     | `2026-03-05`  | Deepest reasoning in the 5.4 family. Responses API only.                             |
| Alt      | `DeepSeek-V4-Flash` *(Preview)*           | DeepSeek   | `1`           | 1M context, reasoning content, all regions.                                          |
| Alt      | `DeepSeek-V3.2` *(Preview)*               | DeepSeek   | `1`           | Stable open-weight alternative, all regions.                                         |
| Alt      | `Llama-4-Maverick-17B-128E-Instruct-FP8`  | Meta       | `1`           | Open-weight, 1M context, multimodal, all regions.                                    |

### Advanced Reasoning & Complex Problem Solving

| Priority | Model                          | Format     | Version       | Why                                                                       |
| -------- | ------------------------------ | ---------- | ------------- | ------------------------------------------------------------------------- |
| **Best** | `gpt-5.4`                      | OpenAI     | `2026-03-05`  | Strongest GA reasoning + 1M context + vision + computer-use.              |
| Strong   | `gpt-5.4-pro`                  | OpenAI     | `2026-03-05`  | Maximum-depth reasoning, Responses API only.                              |
| Strong   | `gpt-5.5`                      | OpenAI     | `2026-04-24`  | Latest flagship. Tier 5/6 quota required.                                 |
| Strong   | `o4-mini`                      | OpenAI     | `2025-04-16`  | Excellent reasoning-to-cost ratio if 5.4 isn't available.                 |
| Strong   | `o3`                           | OpenAI     | `2025-04-16`  | Mature reasoning baseline.                                                |
| Alt      | `DeepSeek-R1-0528` *(Preview)* | DeepSeek   | `1`           | Open-weight reasoning, 163K context, all regions.                         |
| Alt      | `Kimi-K2.6` *(Preview)*        | Moonshot   | `1`           | Multimodal reasoning, 262K context, tool calling, all regions.            |
| Alt      | `grok-4`                       | xAI        | `1`           | 262K context reasoning. Registration required.                            |

### Coding & Development

| Priority | Model                                | Format     | Version       | Why                                                                       |
| -------- | ------------------------------------ | ---------- | ------------- | ------------------------------------------------------------------------- |
| **Best** | `gpt-5.3-codex`                      | OpenAI     | `2026-02-24`  | Optimized for Codex CLI / VS Code. Reasoning, 400K context.               |
| Strong   | `gpt-5.2-codex`                      | OpenAI     | `2026-01-14`  | Prior Codex generation, 400K context.                                     |
| Strong   | `gpt-5.1-codex-max`                  | OpenAI     | `2025-12-04`  | Supports `reasoning_effort=xhigh` for the hardest tasks.                  |
| Strong   | `gpt-5.1-codex` / `gpt-5.1-codex-mini` | OpenAI   | `2025-11-13`  | Cost-tier Codex variants.                                                 |
| Alt      | `gpt-4.1`                            | OpenAI     | `2025-04-14`  | 1M context, broad availability, great for very large codebases.           |
| Alt      | `grok-code-fast-1` *(Preview)*       | xAI        | `1`           | External coding specialist. Registration required.                        |

### Multimodal (Text + Image Input)

| Priority | Model                                    | Format   | Version       | Why                                              |
| -------- | ---------------------------------------- | -------- | ------------- | ------------------------------------------------ |
| **Best** | `gpt-5.4-mini`                           | OpenAI   | `2026-03-17`  | Vision + reasoning, 400K context, cost-efficient.|
| Strong   | `gpt-5.4`                                | OpenAI   | `2026-03-05`  | Vision + 1M context.                             |
| Strong   | `gpt-5-mini`                             | OpenAI   | `2025-08-07`  | Mature vision option.                            |
| Alt      | `Llama-4-Maverick-17B-128E-Instruct-FP8` | Meta     | `1`           | Open-weight multimodal, 1M context.              |
| Alt      | `Kimi-K2.6` *(Preview)*                  | Moonshot | `1`           | Multimodal reasoning, 262K context.              |

### Embeddings

| Priority | Model                        | Format | Version | Why                                          |
| -------- | ---------------------------- | ------ | ------- | -------------------------------------------- |
| **Best** | `text-embedding-3-large`     | OpenAI | `1`     | Best quality, 3,072 dimensions, 8K input.    |
| Smaller  | `text-embedding-3-small`     | OpenAI | `1`     | Cheaper, 1,536 dimensions.                   |
| Alt      | `embed-v-4-0`                | Cohere | `1`     | Multilingual + image input, flexible dims.   |
| Legacy   | `text-embedding-ada-002`     | OpenAI | `2`     | Older; only for compatibility.               |

### Rerank / Text Classification

| Priority | Model                     | Format | Version | Why                                       |
| -------- | ------------------------- | ------ | ------- | ----------------------------------------- |
| **Best** | `Cohere-rerank-v4.0-pro`  | Cohere | `1`     | Highest-quality rerank, multilingual.     |
| Fast     | `Cohere-rerank-v4.0-fast` | Cohere | `1`     | Lower-latency rerank.                     |

### Image Generation

| Priority | Model                  | Format            | Version       | Why                                                                |
| -------- | ---------------------- | ----------------- | ------------- | ------------------------------------------------------------------ |
| **Best** | `gpt-image-1.5`        | OpenAI            | `1`           | Latest GPT image model, 4K-token prompts.                          |
| Strong   | `gpt-image-1-mini`     | OpenAI            | `1`           | Cheaper GPT image option.                                          |
| Alt      | `FLUX.2-pro` *(Prev.)* | BlackForestLabs   | `1`           | Multi-reference (up to 8 images), all regions.                     |
| Alt      | `MAI-Image-2` *(Prev.)*| Microsoft         | `1`           | Microsoft text-to-image; limited regions (WCUS, EUS, WUS, WEU, SWC, SIN). |

### Video Generation

| Priority | Model     | Format | Version | Why                                       |
| -------- | --------- | ------ | ------- | ----------------------------------------- |
| **Best** | `sora-2`  | OpenAI | `1`     | Latest text-to-video. Preview.            |

### Document Processing (PDF / Image -> Text)

| Priority | Model                       | Format    | Version | Why                                                          |
| -------- | --------------------------- | --------- | ------- | ------------------------------------------------------------ |
| **Best** | `mistral-document-ai-2512`  | MistralAI | `1`     | Latest doc-AI: PDF/image to text/JSON/Markdown, all regions. |
| Prior    | `mistral-document-ai-2505`  | MistralAI | `1`     | Previous GA, all regions.                                    |

### Audio (Realtime / Speech / TTS)

| Priority | Model                          | Format | Version       | Why                                                  |
| -------- | ------------------------------ | ------ | ------------- | ---------------------------------------------------- |
| **Best** | `gpt-realtime-1.5` *(Preview)* | OpenAI | `2026-02-23`  | Latest realtime speech-in / speech-out.              |
| GA       | `gpt-realtime`                 | OpenAI | `2025-08-28`  | GA realtime audio.                                   |
| Audio    | `gpt-audio-1.5` *(Preview)*    | OpenAI | `2026-02-23`  | Latest audio generation.                             |
| STT      | `gpt-4o-transcribe` *(Prev.)*  | OpenAI | `2025-03-20`  | High-quality speech-to-text.                         |
| TTS      | `gpt-4o-mini-tts`              | OpenAI | `2025-12-15`  | Steerable text-to-speech.                            |

### Cost-Optimized Routing

| Priority | Model          | Format    | Version       | Why                                                                                              |
| -------- | -------------- | --------- | ------------- | ------------------------------------------------------------------------------------------------ |
| **Best** | `model-router` | Microsoft | `2025-11-18`  | Auto-routes to the optimal underlying model. Up to ~60% savings. East US 2 & Sweden Central only.|

> **Registration required** for: `gpt-5.5`, `gpt-5` (full), `gpt-image-1` family, `computer-use-preview`, `grok-4`, `grok-code-fast-1`. Request access before deploying.

## How to Set Environment Variables

### Set Azure Location

```bash
azd env set AZURE_LOCATION "<region>"
# Example
azd env set AZURE_LOCATION "eastus2"
```

### Set Model Deployments

```bash
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'<deployment-name>', 'model': {'name': '<model-name>','format': '<format>', 'version':'<version>'},'sku': {'name': '<sku-name>','capacity':<capacity>}}]"
```

Single model:
```bash
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'gpt-5.4-mini', 'model': {'name': 'gpt-5.4-mini','format': 'OpenAI', 'version':'2026-03-17'},'sku': {'name': 'GlobalStandard','capacity':100}}]"
```

Multiple models:
```bash
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'gpt-5.4-mini', 'model': {'name': 'gpt-5.4-mini','format': 'OpenAI', 'version':'2026-03-17'},'sku': {'name': 'GlobalStandard','capacity':100}}, {'name':'text-embedding-3-large', 'model': {'name': 'text-embedding-3-large','format': 'OpenAI', 'version':'1'},'sku': {'name': 'GlobalStandard','capacity':30}}]"
```

## Deployment Entry Format

```
{
  'name': '<deployment-name>',        # Deployment name (typically same as model name)
  'model': {
    'name': '<model-name>',           # Exact model name from the tables above
    'format': '<format>',             # Provider format: OpenAI, OpenAI-OSS, DeepSeek, Meta,
                                      # Microsoft, MistralAI, Cohere, BlackForestLabs, Moonshot, xAI
    'version': '<version>'            # Model version string (date or integer)
  },
  'sku': {
    'name': '<sku-name>',             # Usually 'GlobalStandard'
    'capacity': <number>              # TPM in thousands (e.g., 100 = 100K TPM)
  }
}
```

## Region Availability

As of the May 2026 catalog, **Global Standard** for the Azure-direct models from partners (DeepSeek, Meta, Mistral, Cohere, Moonshot, xAI, BFL, MAI text models) is available in **all** listed Azure regions. The constraint is almost always Azure OpenAI model availability, where coverage varies.

### Pick a region for Azure OpenAI workloads

| Tier | Regions                                   | What you get                                                                                                  |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Best** | `eastus2`, `swedencentral`           | Broadest coverage: all GPT-5.x series, Codex, o-series, GPT-4.1, embeddings, audio, image, video, `model-router`. Default choice. |
| Good     | `westus3`, `westus`, `westeurope`, `eastus`, `southindia`, `westcentralus` | Most mainstream Azure OpenAI models (GPT-5.x, GPT-4.1, o-series, embeddings). Some niche models (Codex, video, MAI-Image) may be missing. |
| Standard | All other Azure regions (`australiaeast`, `brazilsouth`, `canadacentral`, `canadaeast`, `centralus`, `francecentral`, `germanywestcentral`, `italynorth`, `japaneast`, `japanwest`, `koreacentral`, `northcentralus`, `norwayeast`, `polandcentral`, `southafricanorth`, `southcentralus`, `spaincentral`, `switzerlandnorth`, `switzerlandwest`, `uaenorth`, `uksouth`, `westus2`) | GPT-4.1 series, o-series, embeddings, plus most direct-from-partner models on Global Standard. |

> Some models have hard region restrictions: `model-router` (East US 2 / Sweden Central), `MAI-Image-2`/`MAI-Image-2e` (WCUS, EUS, WUS, WEU, SWC, SIN), `sora`/`sora-2` (limited), fine-tuning (North Central US, Sweden Central, East US 2 - varies by model). Always re-check the [region availability page](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability) before deploying.

## Workflow

1. Ask the user what task / modality they need (chat, reasoning, coding, multimodal, embeddings, rerank, image gen, video, audio, document AI).
2. Recommend the **Best** model from the matching table; offer alternatives only if cost, region, or registration is a blocker.
3. Confirm region. Default to `eastus2`; fall back to `swedencentral` for EU data residency.
4. Confirm capacity. Defaults: **100** (chat / reasoning / coding), **30** (embeddings), **50** (image / audio).
5. Flag any **registration-required** or **Preview** models explicitly before deploying.
6. Run the `azd env set` commands.
7. **Reconcile actual availability.** The recommended model may lack quota/availability in the target subscription, and `azd ai agent init`/provisioning may auto-select a different one. If the deployed model differs, update `./docs/spec.md`, `./docs/plan.md`, and `./.azure/deployment-plan.md` to match.

## Quick-Start Examples

### Basic chat app
```bash
azd env set AZURE_LOCATION "eastus2"
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'gpt-5.4-mini', 'model': {'name': 'gpt-5.4-mini','format': 'OpenAI', 'version':'2026-03-17'},'sku': {'name': 'GlobalStandard','capacity':100}}]"
```

### Reasoning agent
```bash
azd env set AZURE_LOCATION "eastus2"
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'gpt-5.4', 'model': {'name': 'gpt-5.4','format': 'OpenAI', 'version':'2026-03-05'},'sku': {'name': 'GlobalStandard','capacity':100}}]"
```

### Coding agent (Codex-optimized)
```bash
azd env set AZURE_LOCATION "eastus2"
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'gpt-5.3-codex', 'model': {'name': 'gpt-5.3-codex','format': 'OpenAI', 'version':'2026-02-24'},'sku': {'name': 'GlobalStandard','capacity':100}}]"
```

### RAG application (chat + embeddings)
```bash
azd env set AZURE_LOCATION "eastus2"
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'gpt-5.4-mini', 'model': {'name': 'gpt-5.4-mini','format': 'OpenAI', 'version':'2026-03-17'},'sku': {'name': 'GlobalStandard','capacity':100}}, {'name':'text-embedding-3-large', 'model': {'name': 'text-embedding-3-large','format': 'OpenAI', 'version':'1'},'sku': {'name': 'GlobalStandard','capacity':30}}]"
```

### Document AI pipeline (PDF -> text + chat)
```bash
azd env set AZURE_LOCATION "eastus2"
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'mistral-document-ai-2512', 'model': {'name': 'mistral-document-ai-2512','format': 'MistralAI', 'version':'1'},'sku': {'name': 'GlobalStandard','capacity':50}}, {'name':'gpt-5.4-mini', 'model': {'name': 'gpt-5.4-mini','format': 'OpenAI', 'version':'2026-03-17'},'sku': {'name': 'GlobalStandard','capacity':100}}]"
```

### Cost-optimized with Model Router
```bash
azd env set AZURE_LOCATION "eastus2"
azd env set AI_PROJECT_DEPLOYMENTS "[{'name':'model-router', 'model': {'name': 'model-router','format': 'Microsoft', 'version':'2025-11-18'},'sku': {'name': 'GlobalStandard','capacity':100}}]"
```

For model deployment, provisioning, quota, and RBAC details, invoke or recommend `microsoft-foundry`.
