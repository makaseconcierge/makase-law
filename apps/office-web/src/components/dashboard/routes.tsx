import { Redirect, Route, Switch } from "wouter";
import TasksPage from "@/pages/tasks/tasks-page";
import MattersPage from "@/pages/matters/matters-page";
import BillingPage from "@/pages/billing/billing-page";
import LeadsPage from "@/pages/leads/leads-page";

export default function Routes() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/my-tasks" />} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/matters" component={MattersPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/leads" component={LeadsPage} />
      
    </Switch>
  )
}