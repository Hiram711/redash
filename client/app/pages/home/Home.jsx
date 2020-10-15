import { includes, isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

import Alert from "antd/lib/alert";
import Link from "@/components/Link";
import LoadingOutlinedIcon from "@ant-design/icons/LoadingOutlined";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import DynamicComponent from "@/components/DynamicComponent";
import BeaconConsent from "@/components/BeaconConsent";

import { axios } from "@/services/axios";
import recordEvent from "@/services/recordEvent";
import { messages } from "@/services/auth";
import notification from "@/services/notification";
import { Dashboard } from "@/services/dashboard";
import { Query } from "@/services/query";
import routes from "@/services/routes";

import "./Home.less";

function DeprecatedEmbedFeatureAlert() {
  return (
    <Alert
      className="m-b-15"
      type="warning"
      message={
        <>
          你已设置参数 <code>ALLOW_PARAMETERS_IN_EMBEDS</code>，但该特征暂时不可用。{" "}
          <Link
            href="https://discuss.redash.io/t/support-for-parameters-in-embedded-visualizations/3337"
            target="_blank"
            rel="noopener noreferrer">
            Read more
          </Link>
          .
        </>
      }
    />
  );
}

function EmailNotVerifiedAlert() {
  const verifyEmail = () => {
    axios.post("verification_email/").then(data => {
      notification.success(data.message);
    });
  };

  return (
    <Alert
      className="m-b-15"
      type="warning"
      message={
        <>
          电子邮箱校验邮件已发送，请查收并点击邮件里的链接，已确认邮箱输入正确。{" "}
          <a className="clickable" onClick={verifyEmail}>
            重新发送邮件
          </a>
          .
        </>
      }
    />
  );
}

function FavoriteList({ title, resource, itemUrl, emptyState }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    resource
      .favorites()
      .then(({ results }) => setItems(results))
      .finally(() => setLoading(false));
  }, [resource]);

  return (
    <>
      <div className="d-flex align-items-center m-b-20">
        <p className="flex-fill f-500 c-black m-0">{title}</p>
        {loading && <LoadingOutlinedIcon />}
      </div>
      {!isEmpty(items) && (
        <div className="list-group">
          {items.map(item => (
            <Link key={itemUrl(item)} className="list-group-item" href={itemUrl(item)}>
              <span className="btn-favourite m-r-5">
                <i className="fa fa-star" aria-hidden="true" />
              </span>
              {item.name}
              {item.is_draft && <span className="label label-default m-l-5">草稿</span>}
            </Link>
          ))}
        </div>
      )}
      {isEmpty(items) && !loading && emptyState}
    </>
  );
}

FavoriteList.propTypes = {
  title: PropTypes.string.isRequired,
  resource: PropTypes.func.isRequired, // eslint-disable-line react/forbid-prop-types
  itemUrl: PropTypes.func.isRequired,
  emptyState: PropTypes.node,
};
FavoriteList.defaultProps = { emptyState: null };

function DashboardAndQueryFavoritesList() {
  return (
    <div className="tile">
      <div className="t-body tb-padding">
        <div className="row home-favorites-list">
          <div className="col-sm-6 m-t-20">
            <FavoriteList
              title="我关注的报表"
              resource={Dashboard}
              itemUrl={dashboard => dashboard.url}
              emptyState={
                <p>
                  <span className="btn-favourite m-r-5">
                    <i className="fa fa-star" aria-hidden="true" />
                  </span>
                  <Link href="dashboards">关注的报表</Link>
                </p>
              }
            />
          </div>
          <div className="col-sm-6 m-t-20">
            <FavoriteList
              title="我关注的查询"
              resource={Query}
              itemUrl={query => `queries/${query.id}`}
              emptyState={
                <p>
                  <span className="btn-favourite m-r-5">
                    <i className="fa fa-star" aria-hidden="true" />
                  </span>
                  <Link href="queries">关注的查询</Link>
                </p>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    recordEvent("view", "page", "personal_homepage");
  }, []);

  return (
    <div className="home-page">
      <div className="container">
        {includes(messages, "using-deprecated-embed-feature") && <DeprecatedEmbedFeatureAlert />}
        {includes(messages, "email-not-verified") && <EmailNotVerifiedAlert />}
        <DynamicComponent name="Home.EmptyState">
          <EmptyState
            header="欢迎使用Redash 👋"
            description="连接任何数据源，轻松看见和分享数据。"
            illustration="dashboard"
            helpMessage={<EmptyStateHelpMessage helpLink="https://redash.io/help/user-guide/getting-started" />}
            showDashboardStep
            showInviteStep
            onboardingMode
          />
        </DynamicComponent>
        <DynamicComponent name="HomeExtra" />
        <DashboardAndQueryFavoritesList />
        <BeaconConsent />
      </div>
    </div>
  );
}

routes.register(
  "Home",
  routeWithUserSession({
    path: "/",
    title: "Redash",
    render: pageProps => <Home {...pageProps} />,
  })
);
