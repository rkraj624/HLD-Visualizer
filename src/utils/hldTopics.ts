export type TopicCategory = 
  | 'traffic' 
  | 'data' 
  | 'messaging' 
  | 'infrastructure';

export type TopicStatus = 'interactive' | 'hld-spec' | 'coming-soon';

export interface HLDTopic {
  id: string;
  title: string;
  shortTitle: string;
  category: TopicCategory;
  categoryName: string;
  description: string;
  badgeText: string;
  status: TopicStatus;
  iconName: string;
  accentColor: string;
  tags: string[];
  featuresCount?: number;
  interactiveAlgoId?: string;
}

export const HLD_TOPICS: HLDTopic[] = [
  // Traffic Management
  {
    id: 'rate-limiting',
    title: 'Rate Limiting & Throttling',
    shortTitle: 'Rate Limiting',
    category: 'traffic',
    categoryName: 'Traffic & API Management',
    description: 'Simulate Token Bucket, Leaky Bucket, Fixed & Sliding Windows, DDoS mitigation.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'Zap',
    accentColor: '#3b82f6',
    tags: ['Token Bucket', 'Leaky Bucket', 'Sliding Log', 'DDoS', 'Gateway'],
    featuresCount: 5,
  },
  {
    id: 'load-balancing',
    title: 'Load Balancing & Reverse Proxies',
    shortTitle: 'Load Balancing',
    category: 'traffic',
    categoryName: 'Traffic & API Management',
    description: 'Round Robin, Least Connections, Weighted, IP Hash & L4/L7 Traffic Routing.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'GitBranch',
    accentColor: '#06b6d4',
    tags: ['Round Robin', 'Least Conn', 'Consistent Hash', 'L4/L7', 'Nginx'],
    featuresCount: 4,
  },
  {
    id: 'api-gateway',
    title: 'API Gateway & Circuit Breakers',
    shortTitle: 'API Gateway',
    category: 'traffic',
    categoryName: 'Traffic & API Management',
    description: 'Request routing, auth verification, rate throttling, and resilience fallbacks.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'ShieldAlert',
    accentColor: '#a855f7',
    tags: ['Circuit Breaker', 'Resilience', 'JWT Auth', 'Routing'],
    featuresCount: 4,
  },

  // Data & Storage
  {
    id: 'caching',
    title: 'Distributed Caching & Eviction',
    shortTitle: 'Caching Strategies',
    category: 'data',
    categoryName: 'Data Storage & Caching',
    description: 'Cache-Aside, Write-Through, Write-Back, LRU, LFU, and Redis Clusters.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'Database',
    accentColor: '#10b981',
    tags: ['Cache-Aside', 'LRU Eviction', 'Write-Through', 'Redis'],
    featuresCount: 4,
  },
  {
    id: 'consistent-hashing',
    title: 'Consistent Hashing Ring',
    shortTitle: 'Consistent Hashing',
    category: 'data',
    categoryName: 'Data Storage & Caching',
    description: 'Virtual nodes, hash ring distribution, node additions & minimal remapping.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'CircleDot',
    accentColor: '#f59e0b',
    tags: ['Virtual Nodes', 'Hash Ring', 'Key Remapping', 'DynamoDB'],
    featuresCount: 3,
  },
  {
    id: 'db-sharding',
    title: 'Database Sharding & Partitioning',
    shortTitle: 'DB Sharding',
    category: 'data',
    categoryName: 'Data Storage & Caching',
    description: 'Horizontal Sharding, Range vs Hash Keys, Master-Replica Replication.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'Layers',
    accentColor: '#ec4899',
    tags: ['Horizontal Partition', 'Replication', 'Read Scaling', 'PostgreSQL'],
    featuresCount: 4,
  },

  // Messaging & Events
  {
    id: 'message-queues',
    title: 'Message Queues & Event Streaming',
    shortTitle: 'Message Queues',
    category: 'messaging',
    categoryName: 'Messaging & Event Systems',
    description: 'Kafka Pub/Sub, RabbitMQ, Dead Letter Queues, At-Least-Once Delivery.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'MessageSquare',
    accentColor: '#8b5cf6',
    tags: ['Kafka', 'RabbitMQ', 'DLQ', 'Pub/Sub', 'Event Driven'],
    featuresCount: 4,
  },
  {
    id: 'service-discovery',
    title: 'Service Discovery & Health Checks',
    shortTitle: 'Service Discovery',
    category: 'messaging',
    categoryName: 'Messaging & Event Systems',
    description: 'Dynamic IP registry, heartbeat signals, Consul/Eureka peer syncing.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'Radio',
    accentColor: '#14b8a6',
    tags: ['Consul', 'Heartbeats', 'gRPC', 'Dynamic Registry'],
    featuresCount: 3,
  },

  // Infrastructure
  {
    id: 'cdn-storage',
    title: 'CDN & Distributed Object Store',
    shortTitle: 'CDN & Object Store',
    category: 'infrastructure',
    categoryName: 'Scalability & Infrastructure',
    description: 'Edge PoPs, S3 Object Storage, Multipart Chunking, Origin Shielding.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'Cloud',
    accentColor: '#38bdf8',
    tags: ['Edge POP', 'S3', 'Cloudflare', 'Chunking'],
    featuresCount: 4,
  },
  {
    id: 'consensus',
    title: 'Distributed Locking & Consensus',
    shortTitle: 'Consensus & Locks',
    category: 'infrastructure',
    categoryName: 'Scalability & Infrastructure',
    description: 'Raft / Paxos consensus, Redis Redlock, Leader election protocols.',
    badgeText: 'Live Simulator',
    status: 'interactive',
    iconName: 'Lock',
    accentColor: '#f43f5e',
    tags: ['Raft', 'Redlock', 'Leader Election', 'ZooKeeper'],
    featuresCount: 3,
  },
];
