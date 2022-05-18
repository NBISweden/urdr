import "../index.css";
import React from "react";
import { AuthContext } from "../components/AuthProvider";
import { HeaderUser } from "../components/HeaderUser";
import { Row } from "../components/Row";
import { Cell } from "../components/Cell";
import { IssueActivityPair, FetchedTimeEntry } from "../model";
import { QuickAdd } from "../components/QuickAdd";
import weektravel from "../icons/weektravel.png";
import overview from "../icons/overview.png";

export const Help = () => {
  const context = React.useContext(AuthContext);
  const exampleIAP: IssueActivityPair = {
    activity: {
      id: 1,
      name: "Test activity",
    },
    issue: {
      id: 1,
      subject: "Test issue",
    },
    custom_name: "Test custom name",
    is_hidden: false,
  };
  const exampleEntry: FetchedTimeEntry = {
    id: 1,
    project: {
      id: 1,
      name: "Test project",
    },
    issue: {
      id: 1,
    },
    user: {
      id: 1,
      name: "Test user",
    },
    activity: {
      id: 1,
      name: "Test activity",
    },
    hours: 1,
    comments: "Test comments",
    spent_on: "2020-01-01",
    created_on: "2020-01-01",
    updated_on: "2020-01-01",
  };
  return (
    <main>
      <div className="usr-header">
        <h1 className="help-title">How do I use the urdr service?</h1>
        <HeaderUser username={context.user ? context.user.login : ""} />
      </div>
      <div className="help-wrapper">
        <h2 className="help-subtitle">Introduction</h2>
        <p className="help-info">
          The purpose of this website is to ease the process of logging time on
          the
          <a href="https://projects.nbis.se"> NBIS Redmine instance</a>. The
          usual procedure for logging time with Redmine involves selecting an
          issue and an activity for reporting your time. In urdr, issues are
          strictly linked to valid activities, thus making it simpler to do time
          reporting accurately. In order to improve the user experience, the
          time reporting page offers a spreadsheet-like grid for time entry
          reporting, together with an intuitive way of navigating over different
          weeks. The report view is primarily made up of a header containing a
          week navigation handler and a user dropdown menu, the time entries
          grid, and the bottom bar including the feature for adding new rows and
          saving your changes.
        </p>
        <div className="centered">
          <img src={overview} alt="overview of urdr" className="overview-img" />
        </div>
        <h2 className="help-subtitle">What is a row?</h2>
        <p className="help-info">
          Within the context of the urdr system, we refer to a row as to the
          visual element on the page where the time entries of a given
          issue-acivity pair are displayed for one specific week. There are two
          types of rows: favourite and recent rows.
        </p>
        <h2 className="help-subtitle">Favourite and recent rows</h2>
        <p className="help-info">
          The following row has been marked as favourite so it will always
          appear at the top of the list. Rows are marked as favourite /
          non-favourite after clicking on the star button present next to the
          title of the corresponding issue. It's worth noting that favourite
          rows are saved across sessions. Moreover, the order of the favourite
          rows can be changed by drag and dropping the row using the
          drag–and–drop handle icon at the left-most position of the row.
        </p>
        <Row
          topic={exampleIAP}
          days={[new Date()]}
          rowHours={[1]}
          rowEntries={[exampleEntry]}
          getRowSum={() => 1}
          onHide={() => {}}
          isFav={true}
          onToggleFav={() => {}}
          onCellUpdate={() => {}}
        ></Row>
        <p className="help-info">
          The next one is a recent row. If desired, these type of rows can be
          hidden and/or after clicking on the eye button. It's worth noting that
          recent rows change as you navigate across different weeks or as you
          add new time entries.
        </p>
        <Row
          topic={exampleIAP}
          days={[new Date()]}
          rowHours={[1]}
          rowEntries={[exampleEntry]}
          getRowSum={() => 1}
          onHide={() => {}}
          isFav={false}
          onToggleFav={() => {}}
          onCellUpdate={() => {}}
        ></Row>
        <h2 className="help-subtitle">Adding new rows</h2>
        <p className="help-info">
          In order to add a new row, it is necessary to first enter a valid
          issue number and then select an activity, which will be linked to the
          issue. After clicking on the plus button, a new row will be appended
          to the bottom of the list of recent rows.
        </p>
        <QuickAdd addIssueActivity={() => {}}></QuickAdd>
        <p className="help-info">
          If you have accidentally hidden a row, you can always bring it back by
          using this feature.
        </p>
        <h2 className="help-subtitle">Adding or updating time entries</h2>
        <p className="help-info">
          One may log time by simply clicking on the cell corresponding to the
          desired date. If the cell is emptied, the underlying time entry will
          be deleted. It's of course also possible to update existing values of
          a cell. All changes made to a cell are saved only after clicking on
          the <b>"Save Changes"</b> button.
        </p>
        <p className="help-info">
          It is also possible to add a comment to a time entry by clicking on
          the triangle present at the top right of a cell. The color of this
          icon is grey when a comment has not been saved yet:
        </p>
        <div className="centered">
          <Cell
            topic={exampleIAP}
            date={new Date()}
            hours={1}
            comments={""}
            entryId={1}
            onCellUpdate={() => {}}
          />
        </div>
        <p className="help-info">
          However, once the comment has been saved along with the time entry,
          the triangle turns black:
        </p>
        <div className="centered">
          <Cell
            topic={exampleIAP}
            date={new Date()}
            hours={1}
            comments={"Test comment"}
            entryId={1}
            onCellUpdate={() => {}}
          />
        </div>
        <h2 className="help-subtitle">Time travelling</h2>
        <p className="help-info">
          Users can navigate across different weeks by using the left and right
          arrow or using the week picker. The week picker is displayed after
          clicking on the button containing a calendar icon and the current week
          number. It's worth noting that users can also go back to previously
          visited weeks by using the browsers back button.
        </p>
        <div className="centered">
          <img
            src={weektravel}
            alt="time travelling calendar"
            className="weektravel-img"
          />
        </div>
      </div>
    </main>
  );
};