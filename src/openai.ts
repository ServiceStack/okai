/* Options:
Date: 2024-11-29 17:33:02
Version: 8.53
Tip: To override a DTO option, remove "//" prefix before updating
BaseUrl: https://openai.servicestack.net

//GlobalNamespace: 
//MakePropertiesOptional: False
//AddServiceStackTypes: True
//AddResponseStatus: False
//AddImplicitVersion: 
//AddDescriptionAsComments: True
IncludeTypes: OpenAiChatCompletion.*
//ExcludeTypes: 
//DefaultImports: 
*/


export interface IReturn<T>
{
    createResponse(): T;
}

export interface IPost
{
}

/** @description The tool calls generated by the model, such as function calls. */
// @Api(Description="The tool calls generated by the model, such as function calls.")
// @DataContract
export class ToolCall
{
    /** @description The ID of the tool call. */
    // @DataMember(Name="id")
    // @ApiMember(Description="The ID of the tool call.")
    public id: string;

    /** @description The type of the tool. Currently, only `function` is supported. */
    // @DataMember(Name="type")
    // @ApiMember(Description="The type of the tool. Currently, only `function` is supported.")
    public type: string;

    /** @description The function that the model called. */
    // @DataMember(Name="function")
    // @ApiMember(Description="The function that the model called.")
    public function: string;

    public constructor(init?: Partial<ToolCall>) { (Object as any).assign(this, init); }
}

/** @description A list of messages comprising the conversation so far. */
// @Api(Description="A list of messages comprising the conversation so far.")
// @DataContract
export class OpenAiMessage
{
    /** @description The contents of the message. */
    // @DataMember(Name="content")
    // @ApiMember(Description="The contents of the message.")
    public content: string;

    /** @description The role of the author of this message. Valid values are `system`, `user`, `assistant` and `tool`. */
    // @DataMember(Name="role")
    // @ApiMember(Description="The role of the author of this message. Valid values are `system`, `user`, `assistant` and `tool`.")
    public role: string;

    /** @description An optional name for the participant. Provides the model information to differentiate between participants of the same role. */
    // @DataMember(Name="name")
    // @ApiMember(Description="An optional name for the participant. Provides the model information to differentiate between participants of the same role.")
    public name?: string;

    /** @description The tool calls generated by the model, such as function calls. */
    // @DataMember(Name="tool_calls")
    // @ApiMember(Description="The tool calls generated by the model, such as function calls.")
    public tool_calls?: ToolCall[];

    /** @description Tool call that this message is responding to. */
    // @DataMember(Name="tool_call_id")
    // @ApiMember(Description="Tool call that this message is responding to.")
    public tool_call_id?: string;

    public constructor(init?: Partial<OpenAiMessage>) { (Object as any).assign(this, init); }
}

export enum ResponseFormat
{
    Text = 'text',
    JsonObject = 'json_object',
}

// @DataContract
export class OpenAiResponseFormat
{
    /** @description An object specifying the format that the model must output. Compatible with GPT-4 Turbo and all GPT-3.5 Turbo models newer than gpt-3.5-turbo-1106. */
    // @DataMember(Name="response_format")
    // @ApiMember(Description="An object specifying the format that the model must output. Compatible with GPT-4 Turbo and all GPT-3.5 Turbo models newer than gpt-3.5-turbo-1106.")
    public response_format: ResponseFormat;

    public constructor(init?: Partial<OpenAiResponseFormat>) { (Object as any).assign(this, init); }
}

export enum OpenAiToolType
{
    Function = 'function',
}

// @DataContract
export class OpenAiTools
{
    /** @description The type of the tool. Currently, only function is supported. */
    // @DataMember(Name="type")
    // @ApiMember(Description="The type of the tool. Currently, only function is supported.")
    public type: OpenAiToolType;

    public constructor(init?: Partial<OpenAiTools>) { (Object as any).assign(this, init); }
}

/** @description Given a list of messages comprising a conversation, the model will return a response. */
// @Api(Description="Given a list of messages comprising a conversation, the model will return a response.")
// @DataContract
export class OpenAiChat
{
    /** @description A list of messages comprising the conversation so far. */
    // @DataMember(Name="messages")
    // @ApiMember(Description="A list of messages comprising the conversation so far.")
    public messages: OpenAiMessage[] = [];

    /** @description ID of the model to use. See the model endpoint compatibility table for details on which models work with the Chat API */
    // @DataMember(Name="model")
    // @ApiMember(Description="ID of the model to use. See the model endpoint compatibility table for details on which models work with the Chat API")
    public model: string;

    /** @description Number between `-2.0` and `2.0`. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
    // @DataMember(Name="frequency_penalty")
    // @ApiMember(Description="Number between `-2.0` and `2.0`. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.")
    public frequency_penalty?: number;

    /** @description Modify the likelihood of specified tokens appearing in the completion. */
    // @DataMember(Name="logit_bias")
    // @ApiMember(Description="Modify the likelihood of specified tokens appearing in the completion.")
    public logit_bias?: { [index:number]: number; };

    /** @description Whether to return log probabilities of the output tokens or not. If true, returns the log probabilities of each output token returned in the content of message. */
    // @DataMember(Name="logprobs")
    // @ApiMember(Description="Whether to return log probabilities of the output tokens or not. If true, returns the log probabilities of each output token returned in the content of message.")
    public logprobs?: boolean;

    /** @description An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability. logprobs must be set to true if this parameter is used. */
    // @DataMember(Name="top_logprobs")
    // @ApiMember(Description="An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability. logprobs must be set to true if this parameter is used.")
    public top_logprobs?: number;

    /** @description The maximum number of tokens that can be generated in the chat completion. */
    // @DataMember(Name="max_tokens")
    // @ApiMember(Description="The maximum number of tokens that can be generated in the chat completion.")
    public max_tokens?: number;

    /** @description How many chat completion choices to generate for each input message. Note that you will be charged based on the number of generated tokens across all of the choices. Keep `n` as `1` to minimize costs. */
    // @DataMember(Name="n")
    // @ApiMember(Description="How many chat completion choices to generate for each input message. Note that you will be charged based on the number of generated tokens across all of the choices. Keep `n` as `1` to minimize costs.")
    public n?: number;

    /** @description Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
    // @DataMember(Name="presence_penalty")
    // @ApiMember(Description="Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.")
    public presence_penalty?: number;

    /** @description An object specifying the format that the model must output. Compatible with GPT-4 Turbo and all GPT-3.5 Turbo models newer than `gpt-3.5-turbo-1106`. Setting Type to ResponseFormat.JsonObject enables JSON mode, which guarantees the message the model generates is valid JSON. */
    // @DataMember(Name="response_format")
    // @ApiMember(Description="An object specifying the format that the model must output. Compatible with GPT-4 Turbo and all GPT-3.5 Turbo models newer than `gpt-3.5-turbo-1106`. Setting Type to ResponseFormat.JsonObject enables JSON mode, which guarantees the message the model generates is valid JSON.")
    public response_format?: OpenAiResponseFormat;

    /** @description This feature is in Beta. If specified, our system will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed, and you should refer to the system_fingerprint response parameter to monitor changes in the backend. */
    // @DataMember(Name="seed")
    // @ApiMember(Description="This feature is in Beta. If specified, our system will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed, and you should refer to the system_fingerprint response parameter to monitor changes in the backend.")
    public seed?: number;

    /** @description Up to 4 sequences where the API will stop generating further tokens. */
    // @DataMember(Name="stop")
    // @ApiMember(Description="Up to 4 sequences where the API will stop generating further tokens.")
    public stop?: string[];

    /** @description If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as data-only server-sent events as they become available, with the stream terminated by a `data: [DONE]` message. */
    // @DataMember(Name="stream")
    // @ApiMember(Description="If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as data-only server-sent events as they become available, with the stream terminated by a `data: [DONE]` message.")
    public stream?: boolean;

    /** @description What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. */
    // @DataMember(Name="temperature")
    // @ApiMember(Description="What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.")
    public temperature?: number;

    /** @description An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. */
    // @DataMember(Name="top_p")
    // @ApiMember(Description="An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.")
    public top_p?: number;

    /** @description A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for. A max of 128 functions are supported. */
    // @DataMember(Name="tools")
    // @ApiMember(Description="A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for. A max of 128 functions are supported.")
    public tools?: OpenAiTools[];

    /** @description A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. */
    // @DataMember(Name="user")
    // @ApiMember(Description="A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.")
    public user?: string;

    public constructor(init?: Partial<OpenAiChat>) { (Object as any).assign(this, init); }
}

// @DataContract
export class ResponseError
{
    // @DataMember(Order=1)
    public errorCode: string;

    // @DataMember(Order=2)
    public fieldName: string;

    // @DataMember(Order=3)
    public message: string;

    // @DataMember(Order=4)
    public meta: { [index:string]: string; };

    public constructor(init?: Partial<ResponseError>) { (Object as any).assign(this, init); }
}

// @DataContract
export class ResponseStatus
{
    // @DataMember(Order=1)
    public errorCode: string;

    // @DataMember(Order=2)
    public message: string;

    // @DataMember(Order=3)
    public stackTrace: string;

    // @DataMember(Order=4)
    public errors: ResponseError[];

    // @DataMember(Order=5)
    public meta: { [index:string]: string; };

    public constructor(init?: Partial<ResponseStatus>) { (Object as any).assign(this, init); }
}

// @DataContract
export class ChoiceMessage
{
    /** @description The contents of the message. */
    // @DataMember(Name="content")
    // @ApiMember(Description="The contents of the message.")
    public content: string;

    /** @description The tool calls generated by the model, such as function calls. */
    // @DataMember(Name="tool_calls")
    // @ApiMember(Description="The tool calls generated by the model, such as function calls.")
    public tool_calls?: ToolCall[];

    /** @description The role of the author of this message. */
    // @DataMember(Name="role")
    // @ApiMember(Description="The role of the author of this message.")
    public role: string;

    public constructor(init?: Partial<ChoiceMessage>) { (Object as any).assign(this, init); }
}

export class Choice
{
    /** @description The reason the model stopped generating tokens. This will be stop if the model hit a natural stop point or a provided stop sequence, length if the maximum number of tokens specified in the request was reached, content_filter if content was omitted due to a flag from our content filters, tool_calls if the model called a tool */
    // @DataMember(Name="finish_reason")
    // @ApiMember(Description="The reason the model stopped generating tokens. This will be stop if the model hit a natural stop point or a provided stop sequence, length if the maximum number of tokens specified in the request was reached, content_filter if content was omitted due to a flag from our content filters, tool_calls if the model called a tool")
    public finish_reason: string;

    /** @description The index of the choice in the list of choices. */
    // @DataMember(Name="index")
    // @ApiMember(Description="The index of the choice in the list of choices.")
    public index: number;

    /** @description A chat completion message generated by the model. */
    // @DataMember(Name="message")
    // @ApiMember(Description="A chat completion message generated by the model.")
    public message: ChoiceMessage;

    public constructor(init?: Partial<Choice>) { (Object as any).assign(this, init); }
}

/** @description Usage statistics for the completion request. */
// @Api(Description="Usage statistics for the completion request.")
// @DataContract
export class OpenAiUsage
{
    /** @description Number of tokens in the generated completion. */
    // @DataMember(Name="completion_tokens")
    // @ApiMember(Description="Number of tokens in the generated completion.")
    public completion_tokens: number;

    /** @description Number of tokens in the prompt. */
    // @DataMember(Name="prompt_tokens")
    // @ApiMember(Description="Number of tokens in the prompt.")
    public prompt_tokens: number;

    /** @description Total number of tokens used in the request (prompt + completion). */
    // @DataMember(Name="total_tokens")
    // @ApiMember(Description="Total number of tokens used in the request (prompt + completion).")
    public total_tokens: number;

    public constructor(init?: Partial<OpenAiUsage>) { (Object as any).assign(this, init); }
}

// @DataContract
export class OpenAiChatResponse
{
    /** @description A unique identifier for the chat completion. */
    // @DataMember(Name="id")
    // @ApiMember(Description="A unique identifier for the chat completion.")
    public id: string;

    /** @description A list of chat completion choices. Can be more than one if n is greater than 1. */
    // @DataMember(Name="choices")
    // @ApiMember(Description="A list of chat completion choices. Can be more than one if n is greater than 1.")
    public choices: Choice[] = [];

    /** @description The Unix timestamp (in seconds) of when the chat completion was created. */
    // @DataMember(Name="created")
    // @ApiMember(Description="The Unix timestamp (in seconds) of when the chat completion was created.")
    public created: number;

    /** @description The model used for the chat completion. */
    // @DataMember(Name="model")
    // @ApiMember(Description="The model used for the chat completion.")
    public model: string;

    /** @description This fingerprint represents the backend configuration that the model runs with. */
    // @DataMember(Name="system_fingerprint")
    // @ApiMember(Description="This fingerprint represents the backend configuration that the model runs with.")
    public system_fingerprint: string;

    /** @description The object type, which is always chat.completion. */
    // @DataMember(Name="object")
    // @ApiMember(Description="The object type, which is always chat.completion.")
    public object: string;

    /** @description Usage statistics for the completion request. */
    // @DataMember(Name="usage")
    // @ApiMember(Description="Usage statistics for the completion request.")
    public usage: OpenAiUsage;

    // @DataMember(Name="responseStatus")
    public responseStatus?: ResponseStatus;

    public constructor(init?: Partial<OpenAiChatResponse>) { (Object as any).assign(this, init); }
}

/** @description Given a list of messages comprising a conversation, the model will return a response. */
// @Route("/v1/chat/completions", "POST")
// @Api(Description="Given a list of messages comprising a conversation, the model will return a response.")
export class OpenAiChatCompletion extends OpenAiChat implements IReturn<OpenAiChatResponse>, IPost
{
    /** @description Provide a unique identifier to track requests */
    // @ApiMember(Description="Provide a unique identifier to track requests")
    public refId?: string;

    /** @description Specify which AI Provider to use */
    // @ApiMember(Description="Specify which AI Provider to use")
    public provider?: string;

    /** @description Categorize like requests under a common group */
    // @ApiMember(Description="Categorize like requests under a common group")
    public tag?: string;

    public constructor(init?: Partial<OpenAiChatCompletion>) { super(init); (Object as any).assign(this, init); }
    public getTypeName() { return 'OpenAiChatCompletion'; }
    public getMethod() { return 'POST'; }
    public createResponse() { return new OpenAiChatResponse(); }
}
