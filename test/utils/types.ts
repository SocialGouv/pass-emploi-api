import { RedisClientType } from '@node-redis/client/dist/lib/client'
import {
  createStubInstance,
  SinonSandbox,
  SinonStubbedInstance,
  SinonStubbedMember,
  StubbableType
} from 'sinon'

export function stubClass<T>(
  constructor: StubbableType<T>,
  overrides?: { [K in keyof T]?: SinonStubbedMember<T[K]> }
): StubbedClass<T> {
  const stub = createStubInstance<T>(constructor, overrides)
  return stub as unknown as StubbedClass<T>
}

export function stubClassSandbox<T>(
  constructor: StubbableType<T>,
  sandbox: SinonSandbox,
  overrides?: { [K in keyof T]?: SinonStubbedMember<T[K]> }
): StubbedClass<T> {
  const stub = sandbox.createStubInstance<T>(constructor, overrides)
  return stub as unknown as StubbedClass<T>
}

export type StubbedClass<T> = SinonStubbedInstance<T> & T

export type RedisClient = RedisClientType<
  {
    json: {
      ARRAPPEND: typeof import('@node-redis/json/dist/commands/ARRAPPEND')
      arrAppend: typeof import('@node-redis/json/dist/commands/ARRAPPEND')
      ARRINDEX: typeof import('@node-redis/json/dist/commands/ARRINDEX')
      arrIndex: typeof import('@node-redis/json/dist/commands/ARRINDEX')
      ARRINSERT: typeof import('@node-redis/json/dist/commands/ARRINSERT')
      arrInsert: typeof import('@node-redis/json/dist/commands/ARRINSERT')
      ARRLEN: typeof import('@node-redis/json/dist/commands/ARRLEN')
      arrLen: typeof import('@node-redis/json/dist/commands/ARRLEN')
      ARRPOP: typeof import('@node-redis/json/dist/commands/ARRPOP')
      arrPop: typeof import('@node-redis/json/dist/commands/ARRPOP')
      ARRTRIM: typeof import('@node-redis/json/dist/commands/ARRTRIM')
      arrTrim: typeof import('@node-redis/json/dist/commands/ARRTRIM')
      DEBUG_MEMORY: typeof import('@node-redis/json/dist/commands/DEBUG_MEMORY')
      debugMemory: typeof import('@node-redis/json/dist/commands/DEBUG_MEMORY')
      DEL: typeof import('@node-redis/json/dist/commands/DEL')
      del: typeof import('@node-redis/json/dist/commands/DEL')
      FORGET: typeof import('@node-redis/json/dist/commands/FORGET')
      forget: typeof import('@node-redis/json/dist/commands/FORGET')
      GET: typeof import('@node-redis/json/dist/commands/GET')
      get: typeof import('@node-redis/json/dist/commands/GET')
      MGET: typeof import('@node-redis/json/dist/commands/MGET')
      mGet: typeof import('@node-redis/json/dist/commands/MGET')
      NUMINCRBY: typeof import('@node-redis/json/dist/commands/NUMINCRBY')
      numIncrBy: typeof import('@node-redis/json/dist/commands/NUMINCRBY')
      NUMMULTBY: typeof import('@node-redis/json/dist/commands/NUMMULTBY')
      numMultBy: typeof import('@node-redis/json/dist/commands/NUMMULTBY')
      OBJKEYS: typeof import('@node-redis/json/dist/commands/OBJKEYS')
      objKeys: typeof import('@node-redis/json/dist/commands/OBJKEYS')
      OBJLEN: typeof import('@node-redis/json/dist/commands/OBJLEN')
      objLen: typeof import('@node-redis/json/dist/commands/OBJLEN')
      RESP: typeof import('@node-redis/json/dist/commands/RESP')
      resp: typeof import('@node-redis/json/dist/commands/RESP')
      SET: typeof import('@node-redis/json/dist/commands/SET')
      set: typeof import('@node-redis/json/dist/commands/SET')
      STRAPPEND: typeof import('@node-redis/json/dist/commands/STRAPPEND')
      strAppend: typeof import('@node-redis/json/dist/commands/STRAPPEND')
      STRLEN: typeof import('@node-redis/json/dist/commands/STRLEN')
      strLen: typeof import('@node-redis/json/dist/commands/STRLEN')
      TYPE: typeof import('@node-redis/json/dist/commands/TYPE')
      type: typeof import('@node-redis/json/dist/commands/TYPE')
    }
    ft: {
      _LIST: typeof import('@node-redis/search/dist/commands/_LIST')
      _list: typeof import('@node-redis/search/dist/commands/_LIST')
      ALTER: typeof import('@node-redis/search/dist/commands/ALTER')
      alter: typeof import('@node-redis/search/dist/commands/ALTER')
      AGGREGATE: typeof import('@node-redis/search/dist/commands/AGGREGATE')
      aggregate: typeof import('@node-redis/search/dist/commands/AGGREGATE')
      ALIASADD: typeof import('@node-redis/search/dist/commands/ALIASADD')
      aliasAdd: typeof import('@node-redis/search/dist/commands/ALIASADD')
      ALIASDEL: typeof import('@node-redis/search/dist/commands/ALIASDEL')
      aliasDel: typeof import('@node-redis/search/dist/commands/ALIASDEL')
      ALIASUPDATE: typeof import('@node-redis/search/dist/commands/ALIASUPDATE')
      aliasUpdate: typeof import('@node-redis/search/dist/commands/ALIASUPDATE')
      CONFIG_GET: typeof import('@node-redis/search/dist/commands/CONFIG_GET')
      configGet: typeof import('@node-redis/search/dist/commands/CONFIG_GET')
      CONFIG_SET: typeof import('@node-redis/search/dist/commands/CONFIG_SET')
      configSet: typeof import('@node-redis/search/dist/commands/CONFIG_SET')
      CREATE: typeof import('@node-redis/search/dist/commands/CREATE')
      create: typeof import('@node-redis/search/dist/commands/CREATE')
      DICTADD: typeof import('@node-redis/search/dist/commands/DICTADD')
      dictAdd: typeof import('@node-redis/search/dist/commands/DICTADD')
      DICTDEL: typeof import('@node-redis/search/dist/commands/DICTDEL')
      dictDel: typeof import('@node-redis/search/dist/commands/DICTDEL')
      DICTDUMP: typeof import('@node-redis/search/dist/commands/DICTDUMP')
      dictDump: typeof import('@node-redis/search/dist/commands/DICTDUMP')
      DROPINDEX: typeof import('@node-redis/search/dist/commands/DROPINDEX')
      dropIndex: typeof import('@node-redis/search/dist/commands/DROPINDEX')
      EXPLAIN: typeof import('@node-redis/search/dist/commands/EXPLAIN')
      explain: typeof import('@node-redis/search/dist/commands/EXPLAIN')
      EXPLAINCLI: typeof import('@node-redis/search/dist/commands/EXPLAINCLI')
      explainCli: typeof import('@node-redis/search/dist/commands/EXPLAINCLI')
      INFO: typeof import('@node-redis/search/dist/commands/INFO')
      info: typeof import('@node-redis/search/dist/commands/INFO')
      PROFILESEARCH: typeof import('@node-redis/search/dist/commands/PROFILE_SEARCH')
      profileSearch: typeof import('@node-redis/search/dist/commands/PROFILE_SEARCH')
      PROFILEAGGREGATE: typeof import('@node-redis/search/dist/commands/PROFILE_AGGREGATE')
      profileAggregate: typeof import('@node-redis/search/dist/commands/PROFILE_AGGREGATE')
      SEARCH: typeof import('@node-redis/search/dist/commands/SEARCH')
      search: typeof import('@node-redis/search/dist/commands/SEARCH')
      SPELLCHECK: typeof import('@node-redis/search/dist/commands/SPELLCHECK')
      spellCheck: typeof import('@node-redis/search/dist/commands/SPELLCHECK')
      SUGADD: typeof import('@node-redis/search/dist/commands/SUGADD')
      sugAdd: typeof import('@node-redis/search/dist/commands/SUGADD')
      SUGDEL: typeof import('@node-redis/search/dist/commands/SUGDEL')
      sugDel: typeof import('@node-redis/search/dist/commands/SUGDEL')
      SUGGET_WITHPAYLOADS: typeof import('@node-redis/search/dist/commands/SUGGET_WITHPAYLOADS')
      sugGetWithPayloads: typeof import('@node-redis/search/dist/commands/SUGGET_WITHPAYLOADS')
      SUGGET_WITHSCORES_WITHPAYLOADS: typeof import('@node-redis/search/dist/commands/SUGGET_WITHSCORES_WITHPAYLOADS')
      sugGetWithScoresWithPayloads: typeof import('@node-redis/search/dist/commands/SUGGET_WITHSCORES_WITHPAYLOADS')
      SUGGET_WITHSCORES: typeof import('@node-redis/search/dist/commands/SUGGET_WITHSCORES')
      sugGetWithScores: typeof import('@node-redis/search/dist/commands/SUGGET_WITHSCORES')
      SUGGET: typeof import('@node-redis/search/dist/commands/SUGGET')
      sugGet: typeof import('@node-redis/search/dist/commands/SUGGET')
      SUGLEN: typeof import('@node-redis/search/dist/commands/SUGLEN')
      sugLen: typeof import('@node-redis/search/dist/commands/SUGLEN')
      SYNDUMP: typeof import('@node-redis/search/dist/commands/SYNDUMP')
      synDump: typeof import('@node-redis/search/dist/commands/SYNDUMP')
      SYNUPDATE: typeof import('@node-redis/search/dist/commands/SYNUPDATE')
      synUpdate: typeof import('@node-redis/search/dist/commands/SYNUPDATE')
      TAGVALS: typeof import('@node-redis/search/dist/commands/TAGVALS')
      tagVals: typeof import('@node-redis/search/dist/commands/TAGVALS')
    }
  },
  Record<string, never>
>
