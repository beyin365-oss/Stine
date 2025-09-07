import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  Plus, 
  Eye, 
  ShoppingCart, 
  Crown, 
  TrendingUp,
  Music,
  Calendar,
  DollarSign,
  Award,
  Flame,
  Globe,
  Lock,
  Unlock,
  Star
} from "lucide-react";

interface NFTDrop {
  id: string;
  title: string;
  description: string;
  type: 'exclusive_set' | 'remix_stems' | 'behind_scenes' | 'limited_edition';
  price: string;
  currency: 'ETH' | 'MATIC' | 'USD';
  totalSupply: number;
  remainingSupply: number;
  royaltyPercentage: number;
  previewUrl?: string;
  imageUrl?: string;
  unlockables?: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  status: 'draft' | 'active' | 'sold_out' | 'ended';
  createdAt: string;
  endsAt?: string;
  creator: {
    id: string;
    djName?: string;
    firstName?: string;
    profileImageUrl?: string;
    verified: boolean;
  };
  stats: {
    views: number;
    likes: number;
    owners: number;
    floorPrice?: string;
  };
}

interface NFTMarketplaceProps {
  djId?: string;
  showCreateButton?: boolean;
}

const nftTypes = [
  { value: 'exclusive_set', label: 'Exclusive DJ Set', icon: Music, description: 'Complete recorded DJ set' },
  { value: 'remix_stems', label: 'Remix Stems', icon: Sparkles, description: 'Track stems for remixing' },
  { value: 'behind_scenes', label: 'Behind the Scenes', icon: Eye, description: 'Exclusive content & insights' },
  { value: 'limited_edition', label: 'Limited Edition', icon: Crown, description: 'Special collectible items' },
];

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500',
};

export function NFTMarketplace({ djId, showCreateButton = true }: NFTMarketplaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("marketplace");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  const [newNFT, setNewNFT] = useState({
    title: "",
    description: "",
    type: "exclusive_set" as const,
    price: "",
    currency: "ETH" as const,
    totalSupply: 1,
    royaltyPercentage: 10,
    unlockables: [] as string[],
    rarity: "rare" as const,
    endsAt: "",
  });

  // Fetch NFT drops
  const { data: nftDrops = [] } = useQuery<NFTDrop[]>({
    queryKey: ['/api/nft/drops', djId, selectedCategory, sortBy],
    refetchInterval: 30000,
  });

  // Fetch trending NFTs
  const { data: trendingNFTs = [] } = useQuery<NFTDrop[]>({
    queryKey: ['/api/nft/trending'],
    refetchInterval: 60000,
  });

  // Fetch user's NFT collection
  const { data: userNFTs = [] } = useQuery<NFTDrop[]>({
    queryKey: ['/api/nft/my-collection'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const createNFTMutation = useMutation({
    mutationFn: async (nftData: any) => {
      return await apiRequest('POST', '/api/nft/create', nftData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nft/drops'] });
      setShowCreateDialog(false);
      setNewNFT({
        title: "",
        description: "",
        type: "exclusive_set",
        price: "",
        currency: "ETH",
        totalSupply: 1,
        royaltyPercentage: 10,
        unlockables: [],
        rarity: "rare",
        endsAt: "",
      });
      toast({
        title: "NFT Drop Created! ✨",
        description: "Your NFT is now live on the marketplace",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create NFT drop. Please try again.",
        variant: "destructive",
      });
    },
  });

  const purchaseNFTMutation = useMutation({
    mutationFn: async (nftId: string) => {
      return await apiRequest('POST', `/api/nft/${nftId}/purchase`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nft/drops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nft/my-collection'] });
      toast({
        title: "NFT Purchased! 🎉",
        description: "Your NFT has been added to your collection",
      });
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase NFT. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateNFT = () => {
    if (!newNFT.title || !newNFT.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and price",
        variant: "destructive",
      });
      return;
    }

    createNFTMutation.mutate(newNFT);
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'epic': return <Star className="w-4 h-4 text-purple-500" />;
      case 'rare': return <Flame className="w-4 h-4 text-blue-500" />;
      default: return <Award className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    if (currency === 'ETH') return `Ξ${numPrice}`;
    if (currency === 'MATIC') return `${numPrice} MATIC`;
    return `$${numPrice}`;
  };

  const NFTCard = ({ nft }: { nft: NFTDrop }) => (
    <Card key={nft.id} className="geometric-clip group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* NFT Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
          {nft.imageUrl ? (
            <img 
              src={nft.imageUrl} 
              alt={nft.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Rarity Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`${rarityColors[nft.rarity]} text-white`}>
              {getRarityIcon(nft.rarity)}
              <span className="ml-1 capitalize">{nft.rarity}</span>
            </Badge>
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {nft.status === 'sold_out' ? (
              <Badge variant="destructive">Sold Out</Badge>
            ) : nft.remainingSupply <= 5 ? (
              <Badge variant="secondary">Only {nft.remainingSupply} left</Badge>
            ) : null}
          </div>
        </div>

        {/* NFT Details */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg" data-testid={`nft-title-${nft.id}`}>
                {nft.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {nft.description}
              </p>
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={nft.creator.profileImageUrl} />
              <AvatarFallback className="text-xs">
                {(nft.creator.djName || nft.creator.firstName || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {nft.creator.djName || nft.creator.firstName}
            </span>
            {nft.creator.verified && (
              <Badge variant="secondary" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Price & Stats */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-lg font-bold" data-testid={`nft-price-${nft.id}`}>
                {formatPrice(nft.price, nft.currency)}
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {nft.stats.views}
              </span>
              <span className="flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                {nft.stats.owners}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {nft.status === 'active' && nft.remainingSupply > 0 ? (
              <Button
                onClick={() => purchaseNFTMutation.mutate(nft.id)}
                disabled={purchaseNFTMutation.isPending}
                className="flex-1"
                data-testid={`button-purchase-${nft.id}`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchase
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" disabled>
                {nft.status === 'sold_out' ? 'Sold Out' : 'Unavailable'}
              </Button>
            )}
            
            <Button variant="outline" size="sm" data-testid={`button-view-${nft.id}`}>
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          {/* Unlockables Preview */}
          {nft.unlockables && nft.unlockables.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center space-x-2 mb-2">
                <Unlock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Includes:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {nft.unlockables.slice(0, 3).map((unlockable, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {unlockable}
                  </Badge>
                ))}
                {nft.unlockables.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{nft.unlockables.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-primary" />
            NFT Marketplace
          </h2>
          <p className="text-muted-foreground">Exclusive DJ content and collectibles</p>
        </div>
        
        {showCreateButton && user && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-nft">
                <Plus className="w-4 h-4 mr-2" />
                Create NFT Drop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create NFT Drop</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newNFT.title}
                    onChange={(e) => setNewNFT(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter NFT title"
                    data-testid="input-nft-title"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {nftTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant={newNFT.type === type.value ? "default" : "outline"}
                          className="h-auto p-3 flex flex-col"
                          onClick={() => setNewNFT(prev => ({ ...prev, type: type.value as any }))}
                          data-testid={`button-nft-type-${type.value}`}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-xs text-center">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newNFT.description}
                    onChange={(e) => setNewNFT(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your NFT..."
                    rows={3}
                    data-testid="textarea-nft-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <Input
                      type="number"
                      value={newNFT.price}
                      onChange={(e) => setNewNFT(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.1"
                      step="0.001"
                      data-testid="input-nft-price"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <select
                      value={newNFT.currency}
                      onChange={(e) => setNewNFT(prev => ({ ...prev, currency: e.target.value as any }))}
                      className="w-full p-2 border rounded"
                      data-testid="select-nft-currency"
                    >
                      <option value="ETH">ETH</option>
                      <option value="MATIC">MATIC</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Supply</label>
                    <Input
                      type="number"
                      value={newNFT.totalSupply}
                      onChange={(e) => setNewNFT(prev => ({ ...prev, totalSupply: parseInt(e.target.value) }))}
                      min="1"
                      data-testid="input-nft-supply"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Royalty %</label>
                    <Input
                      type="number"
                      value={newNFT.royaltyPercentage}
                      onChange={(e) => setNewNFT(prev => ({ ...prev, royaltyPercentage: parseInt(e.target.value) }))}
                      min="0"
                      max="20"
                      data-testid="input-nft-royalty"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateNFT}
                  disabled={createNFTMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-nft"
                >
                  {createNFTMutation.isPending ? "Creating..." : "Create NFT Drop"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="my-collection">My Collection</TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded"
              data-testid="select-nft-category"
            >
              <option value="all">All Categories</option>
              <option value="exclusive_set">Exclusive Sets</option>
              <option value="remix_stems">Remix Stems</option>
              <option value="behind_scenes">Behind the Scenes</option>
              <option value="limited_edition">Limited Edition</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border rounded"
              data-testid="select-nft-sort"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="ending_soon">Ending Soon</option>
              <option value="most_popular">Most Popular</option>
            </select>
          </div>

          {/* NFT Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nftDrops.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </TabsContent>

        {/* My Collection Tab */}
        <TabsContent value="my-collection" className="space-y-6">
          {userNFTs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start collecting exclusive DJ content and rare items
                </p>
                <Button onClick={() => setActiveTab("marketplace")}>
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}