import type BaseElement from '@/base/BaseElement'
import DeferredPromise from 'defer-promise'
import { ReactiveController, ReactiveControllerHost } from 'lit'

export declare class WithApiClientInterface {
  $api: APIClientController
}

export type APIClientSDK = {
  storefront: <T>(init: RequestInitWithBody) => Promise<T>
  shopify: apiClientFetch
  fetchClient: apiClientFetch
}

type RequestInitWithBody = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown> | RequestInit['body']
}

type createApiClientConfig = {
  baseUrl: string
  headers?: Record<string, string>
  defaultMethod?: RequestInitWithBody['method']
  onRequestStart?: () => void
  onRequestEnd?: () => void
  signal?: AbortSignal
  withQueue?: boolean
  queueKey?: string
}

type QueueCollectionItem = {
  requestArguments: {
    endpoint: string
    init?: RequestInitWithBody
    options?: RequestOption
  }
  deferred: ReturnType<typeof DeferredPromise>
}

type QueueCollection = Record<string, QueueCollectionItem[]>

const QUEUE_COLLECTION: QueueCollection = {}
const QUEUE_LOADING_STATES: Record<string, boolean> = {}

type RequestOption = {
  params?: Record<string, string | string[]>
  rawBody?: boolean
  removeContentType?: boolean
  withCache?: boolean
}

export type apiClientFetch = <T>(
  endpoint: string,
  init?: RequestInitWithBody,
  options?: RequestOption
) => Promise<T>

const formattedResponse = async (response: Response) => {
  try {
    const contentType = response.headers.get('content-type')

    if (
      contentType &&
      (contentType.includes('application/json') ||
        contentType.includes('application/graphql') ||
        contentType.includes('text/javascript'))
    ) {
      return await response.json()
    }
    return await response.text()
  } catch (error) {
    console.error('Error in formattedResponse', error)
    return await response.text()
  }
}

export const createURLSearchParams = (
  params: Record<string, string | string[]>
) => {
  const searchParams = new URLSearchParams()
  for (const key in params) {
    const currentValue = params[key]
    if (Array.isArray(currentValue)) {
      for (const value of currentValue) {
        searchParams.append(key, value)
      }
    } else {
      searchParams.set(key, currentValue as string)
    }
  }
  return searchParams
}

export const fromURLSearchParams = (searchParams: URLSearchParams) => {
  const params: Record<string, string | string[]> = {}
  for (const [key, value] of searchParams) {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        ;(params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  }
  return params
}

const processRequest = async <T>(
  config: createApiClientConfig,
  cache: APIClientCache,
  endpoint: string,
  init?: RequestInitWithBody,
  options?: RequestOption
): Promise<T> => {
  try {
    const headers = {
      ...config.headers,
      ...(init?.headers || {}),
    }
    const params = options?.params
      ? createURLSearchParams(options.params)
      : null
    config?.onRequestStart?.()
    const finalHeaders = {
      ...headers,
      ...(init?.headers || {}),
    }

    if (options?.removeContentType) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete finalHeaders['Content-Type']
    }
    const method = init?.method || config.defaultMethod || 'GET'
    const withCache = options?.withCache && method === 'GET'
    const finalUrl = `${config.baseUrl}${endpoint}${params ? '?' + params.toString() : ''}`
    if (withCache) {
      const cachedResponse = cache.get(finalUrl)
      if (cachedResponse) {
        return cachedResponse
      }
    }

    const response = await fetch(finalUrl, {
      signal: config.signal,
      method,
      ...(init as RequestInit),
      headers: finalHeaders,
      ...(init?.body &&
        options?.rawBody && { body: init.body as RequestInit['body'] }),
      ...(init?.body &&
        !options?.rawBody && { body: JSON.stringify(init.body) }),
    })

    if (!response.ok || response.status >= 400) {
      throw await formattedResponse(response)
    }

    if (
      (init?.headers as Record<string, string>)?.['Content-Type']?.includes(
        'text/'
      )
    ) {
      const responseText = await response.text()
      if (withCache) {
        cache.set(finalUrl, responseText)
      }

      return responseText as T
    }

    const responseJson = await formattedResponse(response)
    if (withCache) {
      cache.set(finalUrl, responseJson)
    }
    return responseJson
  } catch (error) {
    console.error('Error in createApiClient', error)
    throw error
  } finally {
    config?.onRequestEnd?.()
  }
}

export const processQueueWithKey = async (
  config: createApiClientConfig,
  cache: APIClientCache,
  queueKey: string
) => {
  if (QUEUE_LOADING_STATES[queueKey]) {
    return
  }

  QUEUE_LOADING_STATES[queueKey] = true
  const queue = QUEUE_COLLECTION[queueKey]
  while (queue.length > 0) {
    const { requestArguments, deferred } = queue.shift() as QueueCollectionItem

    try {
      const response = await processRequest(
        config,
        cache,
        requestArguments.endpoint,
        requestArguments.init,
        requestArguments.options
      )
      deferred.resolve(response)
    } catch (error) {
      deferred.reject(error)
    }
  }

  QUEUE_LOADING_STATES[queueKey] = false
}

export const createApiClient = (config: createApiClientConfig) => {
  const cache = new APIClientCache()
  if (config.withQueue && config.queueKey) {
    if (!QUEUE_COLLECTION[config.queueKey]) {
      QUEUE_COLLECTION[config.queueKey] = []
    }
  }

  return <T>(
    endpoint: string,
    init?: RequestInitWithBody,
    options?: RequestOption
  ): Promise<T> => {
    if (config.withQueue && config.queueKey) {
      const deferred = DeferredPromise<T>()
      QUEUE_COLLECTION[config.queueKey].push({
        requestArguments: { endpoint, init, options },
        deferred,
      })
      processQueueWithKey(config, cache, config.queueKey)
      return deferred.promise
    }

    return processRequest<T>(config, cache, endpoint, init, options)
  }
}

export const WithApiClientMixin = <T extends AbstractConstructor<BaseElement>>(
  superClass: T
) => {
  abstract class WithApiClientClass extends superClass {
    $api = new APIClientController(this)
  }
  // Cast return type to your mixin's interface intersected with the superClass type
  return WithApiClientClass as AbstractConstructor<WithApiClientInterface> & T
}

export class APIClientController implements ReactiveController {
  host: ReactiveControllerHost
  abortController: AbortController = new AbortController()

  constructor(host: ReactiveControllerHost) {
    ;(this.host = host).addController(this)
  }

  hostDisconnected() {
    this.abortController.abort()
  }

  fetchClient = createApiClient({
    baseUrl: '',
    signal: this.abortController.signal,
  })

  storefrontClient = createApiClient({
    baseUrl: `${window.Shopify.routes.root === '/' ? '' : window.Shopify.routes.root}/api/2024-07/graphql.json`,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': `${window.__STOREFRONT_ACCESS_TOKEN__}`,
    },
    defaultMethod: 'POST',
    signal: this.abortController.signal,
  })

  shopifyClient = createApiClient({
    baseUrl: `${window.Shopify.routes.root}`,
    headers: {
      'Content-Type': 'application/json',
    },
    signal: this.abortController.signal,
  })

  get client() {
    return {
      fetchClient: this.fetchClient,
      storefront: <T>(_: RequestInitWithBody) =>
        this.storefrontClient<T>('', _),
      shopify: this.shopifyClient,
    } satisfies APIClientSDK
  }
}

class APIClientCache {
  private cache = new Map<string, any>()

  get = (key: string) => this.cache.get(key)
  set = (key: string, value: any) => this.cache.set(key, value)
  clear = () => this.cache.clear()
}
