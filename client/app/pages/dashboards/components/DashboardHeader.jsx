import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import { map, includes } from "lodash";
import Button from "antd/lib/button";
import Dropdown from "antd/lib/dropdown";
import Menu from "antd/lib/menu";
import EllipsisOutlinedIcon from "@ant-design/icons/EllipsisOutlined";
import Modal from "antd/lib/modal";
import Tooltip from "antd/lib/tooltip";
import FavoritesControl from "@/components/FavoritesControl";
import EditInPlace from "@/components/EditInPlace";
import { DashboardTagsControl } from "@/components/tags-control/TagsControl";
import getTags from "@/services/getTags";
import { clientConfig } from "@/services/auth";
import { policy } from "@/services/policy";
import { durationHumanize } from "@/lib/utils";
import { DashboardStatusEnum } from "../hooks/useDashboard";

import "./DashboardHeader.less";

function getDashboardTags() {
  return getTags("api/dashboards/tags").then(tags => map(tags, t => t.name));
}

function buttonType(value) {
  return value ? "primary" : "default";
}

function DashboardPageTitle({ dashboardOptions }) {
  const { dashboard, canEditDashboard, updateDashboard, editingLayout } = dashboardOptions;
  return (
    <div className="title-with-tags">
      <div className="page-title">
        <FavoritesControl item={dashboard} />
        <h3>
          <EditInPlace
            isEditable={editingLayout}
            onDone={name => updateDashboard({ name })}
            value={dashboard.name}
            ignoreBlanks
          />
        </h3>
        <Tooltip title={dashboard.user.name} placement="bottom">
          <img src={dashboard.user.profile_image_url} className="profile-image" alt={dashboard.user.name} />
        </Tooltip>
      </div>
      <DashboardTagsControl
        tags={dashboard.tags}
        isDraft={dashboard.is_draft}
        isArchived={dashboard.is_archived}
        canEdit={canEditDashboard}
        getAvailableTags={getDashboardTags}
        onEdit={tags => updateDashboard({ tags })}
      />
    </div>
  );
}

DashboardPageTitle.propTypes = {
  dashboardOptions: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

function RefreshButton({ dashboardOptions }) {
  const { refreshRate, setRefreshRate, disableRefreshRate, refreshing, refreshDashboard } = dashboardOptions;
  const allowedIntervals = policy.getDashboardRefreshIntervals();
  const refreshRateOptions = clientConfig.dashboardRefreshIntervals;
  const onRefreshRateSelected = ({ key }) => {
    const parsedRefreshRate = parseFloat(key);
    if (parsedRefreshRate) {
      setRefreshRate(parsedRefreshRate);
      refreshDashboard();
    } else {
      disableRefreshRate();
    }
  };
  return (
    <Button.Group>
      <Tooltip title={refreshRate ? `Auto Refreshing every ${durationHumanize(refreshRate)}` : null}>
        <Button type={buttonType(refreshRate)} onClick={() => refreshDashboard()}>
          <i className={cx("zmdi zmdi-refresh m-r-5", { "zmdi-hc-spin": refreshing })} />
          {refreshRate ? durationHumanize(refreshRate) : "刷新"}
        </Button>
      </Tooltip>
      <Dropdown
        trigger={["click"]}
        placement="bottomRight"
        overlay={
          <Menu onClick={onRefreshRateSelected} selectedKeys={[`${refreshRate}`]}>
            {refreshRateOptions.map(option => (
              <Menu.Item key={`${option}`} disabled={!includes(allowedIntervals, option)}>
                {durationHumanize(option)}
              </Menu.Item>
            ))}
            {refreshRate && <Menu.Item key={null}>停止自动刷新</Menu.Item>}
          </Menu>
        }>
        <Button className="icon-button hidden-xs" type={buttonType(refreshRate)}>
          <i className="fa fa-angle-down" />
          <span className="sr-only">Split button!</span>
        </Button>
      </Dropdown>
    </Button.Group>
  );
}

RefreshButton.propTypes = {
  dashboardOptions: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

function DashboardMoreOptionsButton({ dashboardOptions }) {
  const {
    dashboard,
    setEditingLayout,
    togglePublished,
    archiveDashboard,
    managePermissions,
    gridDisabled,
    isDashboardOwnerOrAdmin,
  } = dashboardOptions;

  const archive = () => {
    Modal.confirm({
      title: "报表归档",
      content: `确定要将 "${dashboard.name}" 报表归档？`,
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: archiveDashboard,
      maskClosable: true,
      autoFocusButton: null,
    });
  };

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      overlay={
        <Menu data-test="DashboardMoreButtonMenu">
          <Menu.Item className={cx({ hidden: gridDisabled })}>
            <a onClick={() => setEditingLayout(true)}>编辑</a>
          </Menu.Item>
          {clientConfig.showPermissionsControl && isDashboardOwnerOrAdmin && (
            <Menu.Item>
              <a onClick={managePermissions}>权限管理</a>
            </Menu.Item>
          )}
          {!dashboard.is_draft && (
            <Menu.Item>
              <a onClick={togglePublished}>草稿</a>
            </Menu.Item>
          )}
          <Menu.Item>
            <a onClick={archive}>归档</a>
          </Menu.Item>
        </Menu>
      }>
      <Button className="icon-button m-l-5" data-test="DashboardMoreButton">
        <EllipsisOutlinedIcon rotate={90} />
      </Button>
    </Dropdown>
  );
}

DashboardMoreOptionsButton.propTypes = {
  dashboardOptions: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

function DashboardControl({ dashboardOptions, headerExtra }) {
  const {
    dashboard,
    togglePublished,
    canEditDashboard,
    fullscreen,
    toggleFullscreen,
    showShareDashboardDialog,
  } = dashboardOptions;
  const showPublishButton = dashboard.is_draft;
  const showRefreshButton = true;
  const showFullscreenButton = !dashboard.is_draft;
  const canShareDashboard = canEditDashboard && !dashboard.is_draft;
  const showShareButton = !clientConfig.disablePublicUrls && (dashboard.publicAccessEnabled || canShareDashboard);
  const showMoreOptionsButton = canEditDashboard;
  return (
    <div className="dashboard-control">
      {!dashboard.is_archived && (
        <span className="hidden-print">
          {showPublishButton && (
            <Button className="m-r-5 hidden-xs" onClick={togglePublished}>
              <span className="fa fa-paper-plane m-r-5" /> 发布
            </Button>
          )}
          {showRefreshButton && <RefreshButton dashboardOptions={dashboardOptions} />}
          {showFullscreenButton && (
            <Tooltip className="hidden-xs" title="进入/退出 全屏显示">
              <Button type={buttonType(fullscreen)} className="icon-button m-l-5" onClick={toggleFullscreen}>
                <i className="zmdi zmdi-fullscreen" />
              </Button>
            </Tooltip>
          )}
          {headerExtra}
          {showShareButton && (
            <Tooltip title="报表共享设置">
              <Button
                className="icon-button m-l-5"
                type={buttonType(dashboard.publicAccessEnabled)}
                onClick={showShareDashboardDialog}
                data-test="OpenShareForm">
                <i className="zmdi zmdi-share" />
              </Button>
            </Tooltip>
          )}
          {showMoreOptionsButton && <DashboardMoreOptionsButton dashboardOptions={dashboardOptions} />}
        </span>
      )}
    </div>
  );
}

DashboardControl.propTypes = {
  dashboardOptions: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  headerExtra: PropTypes.node,
};

function DashboardEditControl({ dashboardOptions, headerExtra }) {
  const { setEditingLayout, doneBtnClickedWhileSaving, dashboardStatus, retrySaveDashboardLayout } = dashboardOptions;
  let status;
  if (dashboardStatus === DashboardStatusEnum.SAVED) {
    status = <span className="save-status">已保存</span>;
  } else if (dashboardStatus === DashboardStatusEnum.SAVING) {
    status = (
      <span className="save-status" data-saving>
        正在保存
      </span>
    );
  } else {
    status = (
      <span className="save-status" data-error>
        保存失败
      </span>
    );
  }
  return (
    <div className="dashboard-control">
      {status}
      {dashboardStatus === DashboardStatusEnum.SAVING_FAILED ? (
        <Button type="primary" onClick={retrySaveDashboardLayout}>
          重试
        </Button>
      ) : (
        <Button loading={doneBtnClickedWhileSaving} type="primary" onClick={() => setEditingLayout(false)}>
          {!doneBtnClickedWhileSaving && <i className="fa fa-check m-r-5" />} 保存
        </Button>
      )}
      {headerExtra}
    </div>
  );
}

DashboardEditControl.propTypes = {
  dashboardOptions: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  headerExtra: PropTypes.node,
};

export default function DashboardHeader({ dashboardOptions, headerExtra }) {
  const { editingLayout } = dashboardOptions;
  const DashboardControlComponent = editingLayout ? DashboardEditControl : DashboardControl;

  return (
    <div className="dashboard-header">
      <DashboardPageTitle dashboardOptions={dashboardOptions} />
      <DashboardControlComponent dashboardOptions={dashboardOptions} headerExtra={headerExtra} />
    </div>
  );
}

DashboardHeader.propTypes = {
  dashboardOptions: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  headerExtra: PropTypes.node,
};
