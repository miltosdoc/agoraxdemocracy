import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Users, UserPlus, LogOut, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { GroupWithMembers } from "@shared/schema";
import { useTranslation } from "@/hooks/use-translation";

const createGroupFormSchema = z.object({ name: z.string().min(1, "Το όνομα είναι υποχρεωτικό") });
type CreateGroupForm = z.infer<typeof createGroupFormSchema>;

const addMemberFormSchema = z.object({
  email: z.string().email(t('groups.invalidEmail')),
});
type AddMemberForm = z.infer<typeof addMemberFormSchema>;

export default function GroupsPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [leaveGroupDialogOpen, setLeaveGroupDialogOpen] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);

  const createGroupForm = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const addMemberForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const { data: groups, isLoading } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const res = await apiRequest("POST", "/api/groups", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('groups.groupCreated'),
        description: t('groups.groupCreatedSuccess'),
      });
      createGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error: any) => {
      toast({
        title: t('general.error'),
        description: error.message || t('groups.failedToCreateGroup'),
        variant: "destructive",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, email }: { groupId: number; email: string }) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/members`, { email });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('groups.memberAdded'),
        description: t('groups.memberAddedSuccess'),
      });
      addMemberForm.reset();
      setAddMemberDialogOpen(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error: any) => {
      const message = error.message === "User with this email is not registered"
        ? t('groups.userNotRegistered')
        : t('groups.failedToAddMember');
      toast({
        title: t('general.error'),
        description: message,
        variant: "destructive",
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest("DELETE", `/api/groups/${groupId}/leave`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('groups.leftGroup'),
        description: t('groups.leftGroupSuccess'),
      });
      setLeaveGroupDialogOpen(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error: any) => {
      toast({
        title: t('general.error'),
        description: error.message || t('groups.failedToLeaveGroup'),
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest("DELETE", `/api/groups/${groupId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('groups.groupDeleted'),
        description: t('groups.groupDeletedSuccess'),
      });
      setDeleteGroupDialogOpen(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error: any) => {
      toast({
        title: t('general.error'),
        description: error.message || t('groups.failedToDeleteGroup'),
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  const handleAddMember = (data: AddMemberForm) => {
    if (selectedGroup) {
      addMemberMutation.mutate({
        groupId: selectedGroup.id,
        email: data.email,
      });
    }
  };

  const handleLeaveGroup = () => {
    if (selectedGroup) {
      leaveGroupMutation.mutate(selectedGroup.id);
    }
  };

  const handleDeleteGroup = () => {
    if (selectedGroup) {
      deleteGroupMutation.mutate(selectedGroup.id);
    }
  };

  const openAddMemberDialog = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    setAddMemberDialogOpen(true);
  };

  const openLeaveGroupDialog = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    setLeaveGroupDialogOpen(true);
  };

  const openDeleteGroupDialog = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    setDeleteGroupDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const isCreator = (group: GroupWithMembers) => {
    return user && group.creatorId === user.id;
  };

  const isMember = (group: GroupWithMembers) => {
    return user && group.members.some((member) => member.userId === user.id);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 pb-16 sm:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('groups.management')}</h1>
            <p className="text-muted-foreground">{t('groups.manageGroups')}</p>
          </div>

          {/* Create New Group Section */}
          <Card className="mb-8" data-testid="card-create-group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('groups.createNewGroup')}
              </CardTitle>
              <CardDescription>
                {t('groups.createFirstGroup')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createGroupForm}>
                <form
                  onSubmit={createGroupForm.handleSubmit(handleCreateGroup)}
                  className="flex gap-3 items-end"
                >
                  <FormField
                    control={createGroupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t('groups.groupName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('groups.enterGroupName')}
                            data-testid="input-group-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                    data-testid="button-create-group"
                  >
                    {createGroupMutation.isPending ? t('general.loading') : t('groups.createGroup')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Groups List */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('groups.myGroups')}</h2>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !groups || groups.length === 0 ? (
              <Card data-testid="card-empty-state">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('groups.noGroups')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('groups.createFirstGroup')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <Card key={group.id} data-testid={`card-group-${group.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <span data-testid={`text-group-name-${group.id}`}>
                              {group.name}
                            </span>
                            {isCreator(group) && (
                              <Badge variant="secondary" data-testid={`badge-creator-${group.id}`}>
                                <Shield className="h-3 w-3 mr-1" />
                                {t('groups.creator')}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription data-testid={`text-member-count-${group.id}`}>
                            {group.memberCount} {group.memberCount === 1 ? t('groups.member') : t('groups.members')}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {(isCreator(group) || isMember(group)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddMemberDialog(group)}
                              data-testid={`button-add-member-${group.id}`}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              {t('groups.addMember')}
                            </Button>
                          )}
                          {isCreator(group) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteGroupDialog(group)}
                              data-testid={`button-delete-group-${group.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {t('general.delete')}
                            </Button>
                          )}
                          {!isCreator(group) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLeaveGroupDialog(group)}
                              data-testid={`button-leave-group-${group.id}`}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              {t('groups.leaveGroup')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">{t('sortition.members')}</h4>
                        <div className="space-y-2">
                          {group.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                              data-testid={`member-${member.userId}-${group.id}`}
                            >
                              <Avatar className="h-10 w-10">
                                {member.user.profilePicture ? (
                                  <AvatarImage
                                    src={member.user.profilePicture}
                                    alt={member.user.name}
                                  />
                                ) : null}
                                <AvatarFallback>
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-medium text-sm truncate"
                                  data-testid={`text-member-name-${member.userId}`}
                                >
                                  {member.user.name}
                                  {member.userId === group.creatorId && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-2 text-xs"
                                      data-testid={`badge-member-creator-${member.userId}`}
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      {t('groups.creator')}
                                    </Badge>
                                  )}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground truncate"
                                  data-testid={`text-member-email-${member.userId}`}
                                >
                                  {member.user.email}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent data-testid="dialog-add-member">
            <DialogHeader>
              <DialogTitle>{t('groups.addMember')}</DialogTitle>
              <DialogDescription>
                {t('groups.enterMemberEmail')}
              </DialogDescription>
            </DialogHeader>
            <Form {...addMemberForm}>
              <form onSubmit={addMemberForm.handleSubmit(handleAddMember)}>
                <FormField
                  control={addMemberForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('groups.memberEmail')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('groups.enterMemberEmail')}
                          data-testid="input-member-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddMemberDialogOpen(false);
                      addMemberForm.reset();
                    }}
                    data-testid="button-cancel-add-member"
                  >
                    {t('general.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending}
                    data-testid="button-submit-add-member"
                  >
                    {addMemberMutation.isPending ? t('general.loading') : t('groups.add')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Leave Group Confirmation Dialog */}
        <AlertDialog open={leaveGroupDialogOpen} onOpenChange={setLeaveGroupDialogOpen}>
          <AlertDialogContent data-testid="dialog-leave-group">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('groups.confirmLeaveGroup')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('groups.areYouSureLeave')} "{selectedGroup?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-leave-group">
                {t('general.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeaveGroup}
                disabled={leaveGroupMutation.isPending}
                data-testid="button-confirm-leave-group"
              >
                {leaveGroupMutation.isPending ? t('general.loading') : t('groups.leaveGroup')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Group Confirmation Dialog */}
        <AlertDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-group">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('groups.confirmDeleteGroup')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("Are you sure you want to delete")} "{selectedGroup?.name}"? {t("This action cannot be undone")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-group">
                {t('general.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                disabled={deleteGroupMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-group"
              >
                {deleteGroupMutation.isPending ? t('general.loading') : t('general.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  );
}
