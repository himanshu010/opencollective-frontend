import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import styled from 'styled-components';

import { CollectiveType } from '../lib/constants/collectives';
import { addCollectiveCoverData } from '../lib/graphql/queries';

import Body from '../components/Body';
import { Sections } from '../components/collective-page/_constants';
import CollectiveNavbar from '../components/CollectiveNavbar';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Loading from '../components/Loading';
import Page from '../components/Page';
import Transactions from '../components/transactions/Transactions';
import { withUser } from '../components/UserProvider';

const TransactionPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  #footer {
    margin-top: auto;
  }
`;

class TransactionsPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveCoverData
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { Collective: get(props, 'data.Collective') };
  }

  async componentDidMount() {
    const { data } = this.props;
    const Collective = (data && data.Collective) || this.state.collective;
    this.setState({ Collective });
  }

  componentDidUpdate(oldProps) {
    // We store the component in state and update only if the next one is not
    // null because of a bug in Apollo where it strips the `Collective` from data
    // during re-hydratation.
    // See https://github.com/opencollective/opencollective/issues/1872
    const currentCollective = get(this.props, 'data.Collective');
    if (currentCollective && get(oldProps, 'data.Collective') !== currentCollective) {
      this.setState({ Collective: currentCollective });
    }
  }

  render() {
    const { LoggedInUser } = this.props;
    const collective = get(this.props, 'data.Collective') || this.state.Collective;

    if (!collective && this.props.data.loading) {
      return (
        <Page title="Transactions">
          <Loading />
        </Page>
      );
    } else if (!collective) {
      return <ErrorPage data={this.props.data} />;
    }

    return (
      <TransactionPageWrapper className="TransactionsPage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <Container mb={4}>
            <CollectiveNavbar
              collective={collective}
              isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
              showEdit
              selectedSection={collective.type === CollectiveType.COLLECTIVE ? Sections.BUDGET : Sections.TRANSACTIONS}
              callsToAction={{
                hasSubmitExpense: [CollectiveType.COLLECTIVE, CollectiveType.EVENT].includes(collective.type),
              }}
            />
          </Container>

          <Transactions
            collective={collective}
            showCSVlink={true}
            filters={true}
            LoggedInUser={LoggedInUser}
            dateDisplayType="date"
          />
        </Body>

        <Footer />
      </TransactionPageWrapper>
    );
  }
}

export default withUser(addCollectiveCoverData(TransactionsPage));
